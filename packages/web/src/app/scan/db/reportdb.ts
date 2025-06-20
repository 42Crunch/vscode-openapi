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
      testIndex: "id,path,criticality",
      happyPathIndex: "id",
      pathIndex: "id",
      operationIdIndex: "id",
    });
    this.paths = [];
  }

  async initDb() {
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
  ): Promise<void> {
    await this.db.entryIndex.bulkPut(index);
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
    const index = await this.readIndex(sort);

    const found: any = [];
    for (const item of index) {
      if (item.issueType === 5) {
        found.push(item);
      }
    }

    const indexPage = paginate(found, pageIndex, pageSize);
    const pagesCount = Math.ceil(found.length / pageSize);

    const page: unknown[] = [];

    for (const index of indexPage) {
      const data = await this.db.entries.get(index.id);
      const fullEntry = await this.makeFullEntry(data.entry, index);
      page.push(fullEntry);
    }

    console.log("Full page:", page);

    return {
      page,
    };
  }

  async getIssues(
    pageIndex: number,
    pageSize: number,
    sort: { fieldName: string; order?: "asc" | "desc" } | undefined
  ): Promise<{ page: unknown[] }> {
    console.time("Reading index");

    const index = await this.readIndex(sort);

    console.timeEnd("Reading index");

    const found: any = [];
    console.time("Reading issues from index");
    for (const item of index) {
      found.push(item);
    }
    console.timeEnd("Reading issues from index");
    console.log("found", found[0]);

    console.log("Paginating issues", pageIndex, pageSize);
    const indexPage = paginate(found, pageIndex, pageSize);
    const pagesCount = Math.ceil(found.length / pageSize);

    const page: unknown[] = [];

    console.log("Reading issues from index page", indexPage, found);

    for (const index of indexPage) {
      try {
        const data = await this.db.issues.get(index.id);
        console.log("reading issue:", index.id, data);
        const fullIssue = await this.makeFullEntry(data.issue, index);
        page.push(fullIssue);
      } catch (error) {
        console.error("Error reading issue:", index.id, error);
      }
    }

    console.log("Full page:", page);

    return {
      page,
    };
  }

  private async readIndex(sort: { fieldName: string; order?: "asc" | "desc" } | undefined) {
    const orderBy = sort?.fieldName || "path";

    const index = await this.db.issueIndex.orderBy(orderBy).toArray();

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
