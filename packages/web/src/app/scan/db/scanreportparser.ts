import {
  IndexStore,
  makeParser,
  ObjectStore,
  IndexedObjectStore,
  Parser,
  IndexStoreIndex,
} from "@xliic/streaming-parser";
import { ReportDb } from "./reportdb";
import { HappyPathReport, RuntimeOperationReport, TestLogReport } from "@xliic/common/scan-report";

export class ScanReportParser {
  private db: ReportDb;
  private parser: Parser;

  private indexHandler: IndexStore;
  private tests: ObjectStore<TestLogReport>;
  private happyPaths: ObjectStore<HappyPathReport>;
  private operations: IndexedObjectStore<RuntimeOperationReport>;

  private data: {
    scanVersion: string;
    summary?: unknown;

    operationsMap: Map<
      IndexStoreIndex,
      {
        pathIndex: IndexStoreIndex;
        methodIndex: number;
      }
    >;

    happyPathIndex: {
      id: number;
      operationIdIndex: IndexStoreIndex | undefined;
      pathIndex: IndexStoreIndex | undefined;
      methodIndex: number | undefined;
    }[];

    testIndex: {
      id: number;
      operationIdIndex: IndexStoreIndex | undefined;
      pathIndex: IndexStoreIndex | undefined;
      methodIndex: number | undefined;
      criticality: number;
      testType: number;
    }[];
  };

  constructor(db: ReportDb) {
    this.db = db;
    this.parser = this.makeParser();

    this.indexHandler = new IndexStore(IndexBuckets);
    this.tests = new ObjectStore<TestLogReport>();
    this.happyPaths = new ObjectStore<HappyPathReport>();
    this.operations = new IndexedObjectStore<RuntimeOperationReport>();

    this.data = {
      scanVersion: "",
      summary: {},
      testIndex: [],
      happyPathIndex: [],
      operationsMap: new Map(),
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
      await this.db.saveOperations(this.operations.objects());

      this.indexHandler.sort("operationId");
      this.indexHandler.sort("path");

      await this.db.bulkPutIndex("operationId", this.indexHandler.entries("operationId"));
      await this.db.bulkPutIndex("path", this.indexHandler.entries("path"));

      // update test index with operationId and path
      for (const entry of this.data.testIndex) {
        if (entry.operationIdIndex !== undefined) {
          const operation = this.data.operationsMap.get(entry.operationIdIndex)!;
          entry.pathIndex = operation.pathIndex;
          entry.methodIndex = operation.methodIndex;
        }
      }

      await this.db.bulkPutTestIndex(
        this.data.testIndex.map((entry) => ({
          id: entry.id,
          operationIdIndex: entry.operationIdIndex?.id,
          pathIndex: entry.pathIndex?.id,
          methodIndex: entry.methodIndex,
          criticality: entry.criticality,
          testType: entry.testType,
        }))
      );

      // update happy path index with path and method
      for (const entry of this.data.happyPathIndex) {
        if (entry.operationIdIndex !== undefined) {
          const operation = this.data.operationsMap.get(entry.operationIdIndex)!;
          entry.pathIndex = operation.pathIndex;
          entry.methodIndex = operation.methodIndex;
        }
      }

      await this.db.bulkPutHappyPathIndex(
        this.data.happyPathIndex.map((entry) => ({
          id: entry.id,
          operationIdIndex: entry.operationIdIndex?.id,
          pathIndex: entry.pathIndex?.id,
          methodIndex: entry.methodIndex,
        }))
      );

      this.operations.clear();
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

  getSummary(): unknown {
    return this.data.summary;
  }

  makeParser(): Parser {
    return makeParser({
      "$.shallow()": (value: any) => {
        this.data.scanVersion = value.scanVersion;
      },

      "$.summary.shallow()": (value: any) => {
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
        this.onTest(operationId, undefined, undefined, "conformance", value);
      },

      "$.operations.*.authorizationRequestsResults.*.deep()": (
        value: TestLogReport,
        [operationId]: [string]
      ) => {
        this.onTest(operationId, undefined, undefined, "authorization", value);
      },

      "$.operations.*.customRequestsResults.*.deep()": (
        value: TestLogReport,
        [operationId]: [string]
      ) => {
        this.onTest(operationId, undefined, undefined, "custom", value);
      },

      "$.methodNotAllowed.*.*.conformanceRequestsResults.*.deep()": (
        value: TestLogReport,
        [path, method]: [string, string]
      ) => {
        this.onTest(undefined, path, method, "methodNotAllowed", value);
      },
    });
  }

  onOperation(operationId: string, operation: RuntimeOperationReport) {
    const operationIdIndex = this.indexHandler.put("operationId", operationId);
    this.operations.put(operation, operationIdIndex);

    this.data.operationsMap.set(operationIdIndex, {
      pathIndex: this.indexHandler.put("path", operation.path),
      methodIndex: methods[operation.method.toLowerCase()],
    });
  }

  onTest(
    operationId: string | undefined,
    path: string | undefined,
    method: string | undefined,
    testType: TestType,
    test: TestLogReport
  ) {
    const operationIdIndex =
      operationId !== undefined ? this.indexHandler.put("operationId", operationId) : undefined;
    const pathIndex = path !== undefined ? this.indexHandler.put("path", path) : undefined;
    const methodIndex = method !== undefined ? methods[method.toLowerCase()] : undefined;

    this.data.testIndex.push({
      id: this.tests.put(test),
      operationIdIndex,
      pathIndex: pathIndex,
      methodIndex: methodIndex,
      criticality: test.outcome?.criticality ?? -1,
      testType: TestTypeIds[testType],
    });
  }

  onHappyPath(operationId: string, happyPath: HappyPathReport) {
    const operationIdIndex = this.indexHandler.put("operationId", operationId);
    this.data.happyPathIndex.push({
      id: this.happyPaths.put(happyPath),
      operationIdIndex,
      pathIndex: undefined,
      methodIndex: undefined,
    });
  }

  async saveTestIndex(indexHandler: IndexStore) {}

  async saveEntryIndex(indexHandler: IndexStore) {
    // // Some index contains only operationId but not path and method
    // for (const entry of this.data.index) {
    //   if (entry.operationId && this.data.operationsIdMap.has(entry.operationId)) {
    //     const { path, method } = this.data.operationsIdMap.get(entry.operationId)!;
    //     entry.path = path;
    //     entry.method = method;
    //   }
    // }
    // // Sort path ASC
    // this.data.index.sort((a, b) => a.path.localeCompare(b.path));
    // const indexToSave: {
    //   id: number;
    //   path: number;
    //   method: number;
    //   criticality: number;
    //   issueType: number;
    //   operation: number;
    // }[] = [];
    // for (const entry of this.data.index) {
    //   const id = this.data.operationsIdMap.has(entry.operationId)
    //     ? this.data.operationsIdMap.get(entry.operationId)!.id
    //     : -1;
    //   indexToSave.push({
    //     id: entry.id,
    //     path: this.indexHandler.put("paths", entry.path),
    //     method: methods[entry.method],
    //     criticality: entry.criticality,
    //     issueType: entry.issueType,
    //     operation: id,
    //   });
    // }
    // await this.db.bulkPutEntryIndex(indexToSave);
    // this.data.index.length = 0;
    // this.data.operationsIdMap.clear();
  }

  async saveIndex(indexName: "path" | "operationId", objs: { id: number; value: string }[]) {
    await this.db.bulkPutIndex(indexName, objs);
  }
}

const methods: Record<string, number> = {
  get: 1,
  post: 2,
  put: 3,
  delete: 4,
  patch: 5,
  head: 6,
  options: 7,
  trace: 8,
};

const TestTypes = ["methodNotAllowed", "conformance", "authorization", "custom"] as const;
const IndexBuckets = ["path", "operationId"] as const;

type TestType = (typeof TestTypes)[number];

const TestTypeIds: Record<TestType, number> = {
  methodNotAllowed: 1,
  conformance: 2,
  authorization: 3,
  custom: 4,
};
