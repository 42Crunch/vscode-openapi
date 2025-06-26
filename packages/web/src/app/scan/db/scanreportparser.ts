import { makeParser, MutableId, Parser } from "@xliic/streaming-parser";
import {
  GlobalSummary,
  HappyPathReport,
  RuntimeOperationReport,
  TestLogReport,
} from "@xliic/common/scan-report";
import { HttpMethod, HttpMethods } from "@xliic/openapi";

import { ReportDb } from "./reportdb";
import { stores } from "./schema";

export class ScanReportParser {
  private db: ReportDb;
  private parser: Parser;
  private readonly methods: Record<HttpMethod, number>;
  private stores: ReturnType<typeof stores>;

  private scanVersion: string;
  private summary: GlobalSummary | undefined;
  private stats: {
    issues: number;
    lowAndAbove: number;
    criticalAndHigh: number;
  };

  private operationsMap: Map<MutableId, { pathIndex: MutableId; methodIndex: number }>;

  constructor(db: ReportDb) {
    this.db = db;
    this.stores = stores();
    this.parser = this.makeParser();
    this.methods = Object.fromEntries(
      HttpMethods.map((method, index) => [method, index])
    ) as Record<HttpMethod, number>;

    this.scanVersion = "";
    this.summary = undefined;
    this.operationsMap = new Map();
    this.stats = {
      issues: 0,
      lowAndAbove: 0,
      criticalAndHigh: 0,
    };
  }

  async parse(chunk: string | null): Promise<boolean> {
    if (chunk !== null) {
      this.parser.chunk(chunk);

      await this.db.save("happyPath", this.stores.happyPath.objects());
      await this.db.save("test", this.stores.test.objects());

      this.stores.happyPath.trim();
      this.stores.test.trim();

      return false;
    } else {
      await this.db.save("operation", this.stores.operation.objects());

      this.stores.operationIdIndex.sort();
      this.stores.pathIndex.sort();

      await this.db.save("operationIdIndex", this.stores.operationIdIndex.entries());
      await this.db.save("pathIndex", this.stores.pathIndex.entries());
      await this.db.save("testKeyIndex", this.stores.testKeyIndex.entries());

      await this.db.save(
        "testIndex",
        this.stores.testIndex.objects((test) => {
          // update test index with operationId and path
          if (test.operationIdIndex !== undefined) {
            const operation = this.operationsMap.get(test.operationIdIndex)!;
            test.pathIndex = operation.pathIndex;
            test.methodIndex = operation.methodIndex;
          }
          return test;
        })
      );

      await this.db.save(
        "happyPathIndex",
        this.stores.happyPathIndex.objects((happyPath) => {
          const operation = this.operationsMap.get(happyPath.operationIdIndex)!;
          happyPath.pathIndex = operation.pathIndex;
          happyPath.methodIndex = operation.methodIndex;
          return happyPath;
        })
      );

      this.parser.end();
      this.stores = null as any;
      this.operationsMap = null as any;
      return true;
    }
  }

  getScanVersion(): string {
    return this.scanVersion;
  }

  getSummary(): GlobalSummary {
    return this.summary!;
  }

  getStats() {
    return this.stats;
  }

  makeParser(): Parser {
    return makeParser({
      "$.shallow()": (value: any) => {
        this.scanVersion = value.scanVersion;
      },

      "$.summary.deep()": (value: any) => {
        this.summary = value;
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
    const operationIdIndex = this.stores.operationIdIndex.put(operationId);
    this.stores.operation.put(operationIdIndex, operation);

    this.operationsMap.set(operationIdIndex, {
      pathIndex: this.stores.pathIndex.put(operation.path),
      methodIndex: this.methods[operation.method.toLowerCase() as HttpMethod],
    });
  }

  onHappyPath(operationId: string, happyPath: HappyPathReport) {
    const happyPathId = this.stores.happyPath.put(happyPath);
    this.stores.happyPathIndex.put(happyPathId, {
      operationIdIndex: this.stores.operationIdIndex.put(operationId),
      pathIndex: undefined,
      methodIndex: undefined,
    });
  }

  onTest(operationId: string, testType: TestType, test: TestLogReport) {
    this.updateStats(test);

    const testId = this.stores.test.put(test);
    const testKeyIndex = this.stores.testKeyIndex.put(test.test?.key!);
    const operationIdIndex = this.stores.operationIdIndex.put(operationId);

    this.stores.testIndex.put(testId, {
      operationIdIndex,
      pathIndex: undefined,
      methodIndex: undefined,
      testKeyIndex,
      criticality: test.outcome?.criticality!,
      testType: TestTypeIds[testType],
    });
  }

  onMethodNotAllowedTest(path: string, method: string, test: TestLogReport) {
    this.updateStats(test);

    const testId = this.stores.test.put(test);
    const testKeyIndex = this.stores.testKeyIndex.put(test.test?.key!);
    const pathIndex = this.stores.pathIndex.put(path);

    this.stores.testIndex.put(testId, {
      operationIdIndex: undefined,
      pathIndex,
      methodIndex: this.methods[method.toLowerCase() as HttpMethod],
      testKeyIndex,
      criticality: test.outcome?.criticality!,
      testType: TestTypeIds["methodNotAllowed"],
    });
  }

  updateStats(test: TestLogReport) {
    this.stats.issues++;
    const criticality = test.outcome?.criticality;
    if (criticality !== undefined && criticality >= 2) {
      this.stats.lowAndAbove++;
    }
    if (criticality !== undefined && criticality >= 4) {
      this.stats.criticalAndHigh++;
    }
  }
}

const TestTypes = ["methodNotAllowed", "conformance", "authorization", "custom"] as const;

type TestType = (typeof TestTypes)[number];

const TestTypeIds: Record<TestType, number> = {
  methodNotAllowed: 1,
  conformance: 2,
  authorization: 3,
  custom: 4,
};
