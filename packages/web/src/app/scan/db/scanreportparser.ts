import {
  makeParser,
  Index,
  SortableIndexStore,
  SortableIndexStoreIndex,
  ObjectStore,
  IndexedObjectStore,
  Parser,
} from "@xliic/streaming-parser";
import { ReportDb } from "./reportdb";
import {
  GlobalSummary,
  HappyPathReport,
  RuntimeOperationReport,
  TestLogReport,
} from "@xliic/common/scan-report";
import { HttpMethod, HttpMethods } from "@xliic/openapi";

export class ScanReportParser {
  private db: ReportDb;
  private parser: Parser;

  private indexHandler: SortableIndexStore;
  private testKeyIndexHandler: Index;
  private tests: ObjectStore<TestLogReport>;
  private happyPaths: ObjectStore<HappyPathReport>;
  private operations: IndexedObjectStore<RuntimeOperationReport> | null;
  private readonly methods: Record<HttpMethod, number>;

  private data: {
    scanVersion: string;
    summary: GlobalSummary | undefined;
    stats: {
      issues: number;
      lowAndAbove: number;
      criticalAndHigh: number;
    };

    operationsMap: Map<
      SortableIndexStoreIndex,
      {
        pathIndex: SortableIndexStoreIndex;
        methodIndex: number;
      }
    >;

    happyPathIndex: {
      id: number;
      operationIdIndex: SortableIndexStoreIndex;
      pathIndex: SortableIndexStoreIndex | undefined;
      methodIndex: number | undefined;
    }[];

    testIndex: {
      id: number;
      operationIdIndex: SortableIndexStoreIndex | undefined;
      pathIndex: SortableIndexStoreIndex | undefined;
      methodIndex: number | undefined;
      testKeyIndex: number;
      criticality: number;
      testType: number;
    }[];
  };

  constructor(db: ReportDb) {
    this.db = db;
    this.parser = this.makeParser();

    this.indexHandler = new SortableIndexStore(IndexBuckets);
    this.testKeyIndexHandler = new Index();
    this.tests = new ObjectStore<TestLogReport>();
    this.happyPaths = new ObjectStore<HappyPathReport>();
    this.operations = new IndexedObjectStore<RuntimeOperationReport>();
    this.methods = Object.fromEntries(
      HttpMethods.map((method, index) => [method, index])
    ) as Record<HttpMethod, number>;

    this.data = {
      scanVersion: "",
      summary: undefined,
      testIndex: [],
      happyPathIndex: [],
      operationsMap: new Map(),
      stats: {
        issues: 0,
        lowAndAbove: 0,
        criticalAndHigh: 0,
      },
    };
  }

  async parse(chunk: string | null): Promise<boolean> {
    if (chunk !== null) {
      this.parser.chunk(chunk);

      await this.db.saveHappyPaths(this.happyPaths.objects());
      await this.db.saveTests(this.tests.objects());

      this.happyPaths.trim();
      this.tests.trim();

      return false;
    } else {
      await this.db.saveOperations(this.operations!.objects());

      this.indexHandler.sort("operationId");
      this.indexHandler.sort("path");

      await this.db.bulkPutIndex("operationId", this.indexHandler.entries("operationId"));
      await this.db.bulkPutIndex("path", this.indexHandler.entries("path"));
      await this.db.bulkPutIndex("testKey", this.testKeyIndexHandler.entries());

      // update test index with operationId and path
      for (const test of this.data.testIndex) {
        if (test.operationIdIndex !== undefined) {
          const operation = this.data.operationsMap.get(test.operationIdIndex)!;
          test.pathIndex = operation.pathIndex;
          test.methodIndex = operation.methodIndex;
        }
      }

      await this.db.bulkPutTestIndex(
        this.data.testIndex.map((test) => ({
          id: test.id,
          operationIdIndex: test.operationIdIndex?.id,
          pathIndex: test.pathIndex?.id,
          methodIndex: test.methodIndex,
          criticality: test.criticality,
          testType: test.testType,
          testKeyIndex: test.testKeyIndex,
        }))
      );

      // update happy path index with path and method
      for (const happyPath of this.data.happyPathIndex) {
        const operation = this.data.operationsMap.get(happyPath.operationIdIndex)!;
        happyPath.pathIndex = operation.pathIndex;
        happyPath.methodIndex = operation.methodIndex;
      }

      await this.db.bulkPutHappyPathIndex(
        this.data.happyPathIndex.map((happyPath) => ({
          id: happyPath.id,
          operationIdIndex: happyPath.operationIdIndex.id,
          pathIndex: happyPath.pathIndex?.id,
          methodIndex: happyPath.methodIndex,
        }))
      );

      this.operations = null;
      this.data.operationsMap.clear();
      this.data.happyPathIndex.length = 0;
      this.data.testIndex.length = 0;

      this.parser.end();

      console.log("Parsed", this.data.scanVersion, this.data.summary);
      return true;
    }
  }

  getScanVersion(): string {
    return this.data.scanVersion;
  }

  getSummary(): GlobalSummary {
    return this.data.summary!;
  }

  getStats() {
    return this.data.stats;
  }

  async getPaths(): Promise<{ value: number; label: string }[]> {
    return await this.db.getPaths();
  }

  async getOperationIds(): Promise<{ value: number; label: string }[]> {
    return await this.db.getOperationIds();
  }

  makeParser(): Parser {
    return makeParser({
      "$.shallow()": (value: any) => {
        this.data.scanVersion = value.scanVersion;
      },

      "$.summary.deep()": (value: any) => {
        this.data.summary = value;
      },

      "$.operations.*.shallow()": (value: RuntimeOperationReport, [operationId]: [string]) => {
        this.onOperation(operationId, value);
      },

      "$.operations.*.scenarios.*.deep()": (value: HappyPathReport, [operationId]: [string]) => {
        this.onHappyPath(operationId, value);
      },

      "$.operations.*.conformanceRequestsResults.*.deep()": (
        value: TestLogReport,
        [operationId]: [string]
      ) => {
        this.onTest(operationId, "conformance", value);
      },

      "$.operations.*.authorizationRequestsResults.*.deep()": (
        value: TestLogReport,
        [operationId]: [string]
      ) => {
        this.onTest(operationId, "authorization", value);
      },

      "$.operations.*.customRequestsResults.*.deep()": (
        value: TestLogReport,
        [operationId]: [string]
      ) => {
        this.onTest(operationId, "custom", value);
      },

      "$.methodNotAllowed.*.*.conformanceRequestsResults.*.deep()": (
        value: TestLogReport,
        [path, method]: [string, string]
      ) => {
        this.onMethodNotAllowedTest(path, method, value);
      },
    });
  }

  onOperation(operationId: string, operation: RuntimeOperationReport) {
    const operationIdIndex = this.indexHandler.put("operationId", operationId);
    this.operations!.put(operation, operationIdIndex);

    this.data.operationsMap.set(operationIdIndex, {
      pathIndex: this.indexHandler.put("path", operation.path),
      methodIndex: this.methods[operation.method.toLowerCase() as HttpMethod],
    });
  }

  onHappyPath(operationId: string, happyPath: HappyPathReport) {
    this.data.happyPathIndex.push({
      id: this.happyPaths.put(happyPath),
      operationIdIndex: this.indexHandler.put("operationId", operationId),
      pathIndex: undefined,
      methodIndex: undefined,
    });
  }

  onTest(operationId: string, testType: TestType, test: TestLogReport) {
    this.updateStats(test);

    const testKeyIndex = this.testKeyIndexHandler.put(test.test?.key!);

    this.data.testIndex.push({
      id: this.tests.put(test),
      operationIdIndex: this.indexHandler.put("operationId", operationId),
      pathIndex: undefined,
      methodIndex: undefined,
      testKeyIndex,
      criticality: test.outcome?.criticality ?? -1,
      testType: TestTypeIds[testType],
    });
  }

  onMethodNotAllowedTest(path: string, method: string, test: TestLogReport) {
    this.updateStats(test);

    const testKeyIndex = this.testKeyIndexHandler.put(test.test?.key!);

    this.data.testIndex.push({
      id: this.tests.put(test),
      operationIdIndex: undefined,
      pathIndex: this.indexHandler.put("path", path),
      methodIndex: this.methods[method.toLowerCase() as HttpMethod],
      testKeyIndex,
      criticality: test.outcome?.criticality ?? -1,
      testType: TestTypeIds["methodNotAllowed"],
    });
  }

  updateStats(test: TestLogReport) {
    this.data.stats.issues++;
    const criticality = test.outcome?.criticality;
    if (criticality !== undefined && criticality >= 1) {
      this.data.stats.lowAndAbove++;
    }
    if (criticality !== undefined && criticality >= 4) {
      this.data.stats.criticalAndHigh++;
    }
  }
}

const TestTypes = ["methodNotAllowed", "conformance", "authorization", "custom"] as const;
const IndexBuckets = ["path", "operationId"] as const;

type TestType = (typeof TestTypes)[number];

const TestTypeIds: Record<TestType, number> = {
  methodNotAllowed: 1,
  conformance: 2,
  authorization: 3,
  custom: 4,
};
