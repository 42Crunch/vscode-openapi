import { IndexStore, makeParser, ObjectStore, Parser } from "@xliic/streaming-parser";
import { ReportDb } from "./reportdb";
import { HappyPathReport, RuntimeOperationReport, TestLogReport } from "@xliic/common/scan-report";

export class ScanReportParser {
  private db: ReportDb;
  private parser: Parser;

  private indexHandler: IndexStore;
  private tests: ObjectStore<TestLogReport>;
  private happyPaths: ObjectStore<HappyPathReport>;
  private operations: ObjectStore<RuntimeOperationReport>;

  private data: {
    scanVersion: string;
    summary?: unknown;
    operationsIdMap: Map<string, { id: number; path: string; method: string }>;
    testIndex: {
      id: number;
      path: string | undefined;
      method: string | undefined;
      criticality: number;
      testType: number;
      operationId: string | undefined;
    }[];
    happyPathIndex: {
      id: number;
      operationId: string | undefined;
    }[];
  };

  constructor(db: ReportDb) {
    this.db = db;
    this.parser = this.makeParser();

    this.indexHandler = new IndexStore(IndexBuckets);
    this.tests = new ObjectStore<TestLogReport>();
    this.happyPaths = new ObjectStore<HappyPathReport>();
    this.operations = new ObjectStore<RuntimeOperationReport>();

    this.data = {
      scanVersion: "",
      summary: {},
      testIndex: [],
      happyPathIndex: [],
      operationsIdMap: new Map(),
    };
  }

  async parse(chunk: string | null): Promise<boolean> {
    if (chunk !== null) {
      this.parser.chunk(chunk);

      await this.db.saveOperations(this.operations.objects());
      await this.db.saveTests(this.tests.objects());
      await this.db.saveHappyPaths(this.happyPaths.objects());

      this.tests.trim();
      this.happyPaths.trim();
      this.operations.trim();

      return false;
    } else {
      await this.saveEntryIndex(this.indexHandler);

      for (const bucket of IndexBuckets) {
        await this.saveIndex(bucket, this.indexHandler.entries(bucket));
      }

      this.data.operationsIdMap.clear();
      this.data.testIndex.length = 0;
      this.data.happyPathIndex.length = 0;

      this.tests.trim();
      this.happyPaths.trim();
      this.operations.trim();

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
    const foo = this.indexHandler.put("operationId", operationId);
    const id = this.operations.put(operation);

    this.data.operationsIdMap.set(operationId, {
      id,
      path: operation.path,
      method: operation.method.toLowerCase(),
    });
  }

  onTest(
    operationId: string | undefined,
    path: string | undefined,
    method: string | undefined,
    testType: TestType,
    test: TestLogReport
  ) {
    this.data.testIndex.push({
      id: this.tests.put(test),
      path,
      method,
      criticality: test.outcome?.criticality ?? -1,
      testType: TestTypeIds[testType],
      operationId,
    });
  }

  onHappyPath(operationId: string, happyPath: HappyPathReport) {
    this.data.happyPathIndex.push({
      id: this.happyPaths.put(happyPath),
      operationId,
    });
  }

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

const issueTypes: Record<string, number> = {
  methodNotAllowed: 1,
  conformance: 2,
  authorization: 3,
  custom: 4,
  happyPath: 5,
};

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
