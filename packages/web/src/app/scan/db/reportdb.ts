import Dexie from "dexie";

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

  async bulkPutIndex(indexName: "path" | "operationId", index: { id: number; value: string }[]) {
    switch (indexName) {
      case "path":
        //index.forEach((entry) => this.paths.push(entry.value)); // this is used temp only in path dropdown ui
        await this.db.pathIndex.bulkPut(index);
        break;
      case "operationId":
        await this.db.operationIdIndex.bulkPut(index);
        break;
    }
  }

  async getIssue(id: string): Promise<any> {
    return null as any;
  }

  async getPathsKeys(): Promise<any> {
    // looks like this is not used
  }

  async getHappyPaths(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ): Promise<{ page: unknown[] }> {
    const index = await this.readHappyPathIndex(sort);

    const found: any = [];
    for (const item of index) {
      found.push(item);
    }

    const indexPage = paginate(found, pageIndex, pageSize);
    const pagesCount = Math.ceil(found.length / pageSize);

    const page: unknown[] = [];

    for (const index of indexPage) {
      const data = await this.db.happyPath.get(index.id);
      const operation = await this.db.operation.get(index.operationIdIndex);
      const operationId = await this.db.operationIdIndex.get(index.operationIdIndex);
      page.push({
        operationId: operationId!.value,
        operation: operation.value,
        report: data.value,
      });
    }

    return {
      page,
    };
  }

  async getTests(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ): Promise<{ page: unknown[] }> {
    const index = await this.readTestIndex(sort);

    const found: any = [];
    for (const item of index) {
      found.push(item);
    }

    console.log("found", found);

    const indexPage = paginate(found, pageIndex, pageSize);
    const pagesCount = Math.ceil(found.length / pageSize);

    const page: unknown[] = [];

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

      page.push({
        operationId: operationId?.value,
        operation: operation?.value,
        path: path?.value,
        method: "FOO",
        test: data.value,
      });
    }

    return {
      page,
    };
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
