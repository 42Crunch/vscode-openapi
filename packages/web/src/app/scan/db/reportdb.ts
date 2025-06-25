import { HappyPathReport, RuntimeOperationReport, TestLogReport } from "@xliic/common/scan-report";
import Dexie from "dexie";

export type Page<T> = {
  items: T[];
  pages: number;
  total: number;
  current: number;
};

export type HappyPathEntry = {
  operationId: string;
  operation: Pick<RuntimeOperationReport, "path" | "method" | "reason" | "fuzzed">;
  report: HappyPathReport;
};

export type TestEntry = {
  operationId?: string;
  operation?: Pick<RuntimeOperationReport, "path" | "method" | "reason" | "fuzzed">;
  path: string;
  method: string;
  test: TestLogReport;
};

export type Filter = {
  criticality?: number;
  testKey?: number;
  path?: number;
  method?: number;
  operationId?: number;
};

export class ReportDb {
  private readonly name: string = "";
  private db: any;
  public paths: string[];

  constructor(name: string) {
    this.name = name;
    this.db = new Dexie(this.name);
    this.db.version(1).stores({
      test: "id",
      happyPath: "id",
      operation: "id",
      testIndex: "id,pathIndex,criticality",
      happyPathIndex: "id,pathIndex",
      pathIndex: "id",
      operationIdIndex: "id",
      testKeyIndex: "id",
    });
    this.paths = [];
  }

  async initDb() {
    try {
      await Dexie.delete(this.name);
    } catch (error) {
      console.error("Error deleting database:", error);
    }
    await this.db.open();

    await this.db.test.clear();
    await this.db.happyPath.clear();
    await this.db.testIndex.clear();
    await this.db.happyPathIndex.clear();
    await this.db.pathIndex.clear();
    await this.db.operationIdIndex.clear();
    await this.db.testKeyIndex.clear();
    await this.db.operation.clear();
  }

  closeDb(): void {
    // disableAutoOpen: false - allows us to open db instantly after closing
    this.db.close({ disableAutoOpen: false });
  }

  async saveOperations(operations: { id: number; value: unknown }[]) {
    if (operations.length > 0) {
      await this.db.operation.bulkPut(operations);
    }
  }

  async saveTests(tests: { id: number; value: unknown }[]) {
    if (tests.length > 0) {
      await this.db.test.bulkPut(tests);
    }
  }

  async saveHappyPaths(happyPaths: { id: number; value: unknown }[]) {
    if (happyPaths.length > 0) {
      await this.db.happyPath.bulkPut(happyPaths);
    }
  }

  async bulkPutEntryIndex(
    index: {
      id: number;
      path: number;
      method: number;
      criticality: number;
      issueType: number;
      operation: number;
    }[]
  ) {
    await this.db.entryIndex.bulkPut(index);
  }

  async bulkPutOperationIndex(index: unknown[]) {
    await this.db.operationIndex.bulkPut(index);
  }

  async bulkPutHappyPathIndex(index: unknown[]) {
    await this.db.happyPathIndex.bulkPut(index);
  }

  async bulkPutTestIndex(index: unknown[]) {
    await this.db.testIndex.bulkPut(index);
  }

  async bulkPutIndex(
    indexName: "path" | "operationId" | "testKey",
    index: { id: number; value: string }[]
  ) {
    switch (indexName) {
      case "path":
        //index.forEach((entry) => this.paths.push(entry.value)); // this is used temp only in path dropdown ui
        await this.db.pathIndex.bulkPut(index);
        break;
      case "operationId":
        await this.db.operationIdIndex.bulkPut(index);
        break;
      case "testKey":
        await this.db.testKeyIndex.bulkPut(index);
        break;
    }
  }

  async getHappyPaths(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ): Promise<Page<HappyPathEntry>> {
    const index = await this.readHappyPathIndex(sort);

    const found: any = [];
    for (const item of index) {
      found.push(item);
    }

    const indexPage = paginate(found, pageIndex, pageSize);
    const pages = Math.ceil(found.length / pageSize);

    const items: HappyPathEntry[] = [];

    for (const index of indexPage) {
      const data = await this.db.happyPath.get(index.id);
      const operation = await this.db.operation.get(index.operationIdIndex);
      const operationId = await this.db.operationIdIndex.get(index.operationIdIndex);
      items.push({
        operationId: operationId!.value,
        operation: operation.value,
        report: data.value,
      });
    }

    return {
      items,
      pages,
      current: pageIndex,
      total: found.length,
    };
  }

  async getTests(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined,
    filter: Filter
  ): Promise<Page<TestEntry>> {
    const index = await this.readTestIndex(sort);

    const found: any = [];
    for (const item of index) {
      // Apply filtering
      let includeItem = true;

      if (filter.criticality !== undefined && item.criticality < filter.criticality) {
        includeItem = false;
      }

      if (filter.testKey !== undefined && item.testKeyIndex !== filter.testKey) {
        includeItem = false;
      }

      if (filter.path !== undefined && item.pathIndex !== filter.path) {
        includeItem = false;
      }

      if (filter.method !== undefined && item.methodIndex !== filter.method) {
        includeItem = false;
      }

      if (filter.operationId !== undefined && item.operationIdIndex !== filter.operationId) {
        includeItem = false;
      }

      if (includeItem) {
        found.push(item);
      }
    }

    console.log("index", index);
    console.log("found", filter, found);

    const indexPage = paginate(found, pageIndex, pageSize);
    const pages = Math.ceil(found.length / pageSize);

    const items: TestEntry[] = [];

    for (const index of indexPage) {
      const data = await this.db.test.get(index.id);
      const operation =
        index.operationIdIndex !== undefined
          ? await this.db.operation.get(index.operationIdIndex)
          : undefined;
      const operationId =
        index.operationIdIndex !== undefined
          ? await this.db.operationIdIndex.get(index.operationIdIndex)
          : undefined;

      const path =
        index.pathIndex !== undefined ? await this.db.pathIndex.get(index.pathIndex) : undefined;

      items.push({
        operationId: operationId?.value,
        operation: operation?.value,
        path: path?.value,
        method: "FOO",
        test: data.value,
      });
    }

    return {
      items,
      pages,
      current: pageIndex,
      total: found.length,
    };
  }

  async getPaths(): Promise<{ value: number; label: string }[]> {
    return this.db.pathIndex.toArray().then((paths: any) => {
      return paths.map((path: any) => ({
        value: path.id,
        label: path.value,
      }));
    });
  }

  async getOperationIds(): Promise<{ value: number; label: string }[]> {
    return this.db.operationIdIndex.toArray().then((operationIds: any) => {
      return operationIds.map((operationId: any) => ({
        value: operationId.id,
        label: operationId.value,
      }));
    });
  }

  async getTestKeys(): Promise<{ value: number; label: string }[]> {
    return this.db.testKeyIndex.toArray().then((testKeys: any) => {
      return testKeys.map((testKey: any) => ({
        value: testKey.id,
        label: testKey.value,
      }));
    });
  }

  private async readHappyPathIndex(
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ) {
    const orderBy = sort?.fieldName || "pathIndex";

    const index = await this.db.happyPathIndex.orderBy(orderBy).toArray();

    if (sort?.order === "desc") {
      index.reverse();
    }

    return index;
  }

  private async readTestIndex(sort: { fieldName: string; order?: "asc" | "desc" } | undefined) {
    const orderBy = sort?.fieldName || "pathIndex";

    const index = await this.db.testIndex.orderBy(orderBy).toArray();

    if (sort?.order === "desc") {
      index.reverse();
    }

    return index;
  }

  async makeFullEntry(entry: any, index: any) {
    return entry;
  }
}

function paginate(array: any[], page: number, perPage: number): any[] {
  const start = page * perPage;
  const end = start + perPage;
  return array.slice(start, end);
}
