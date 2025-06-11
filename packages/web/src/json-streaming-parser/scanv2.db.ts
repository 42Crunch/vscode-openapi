import Dexie from "dexie";
import {
  PaginationResponse,
  ParserFieldSortOrder,
  ScanReportIntegralFilter,
  SortOrder,
} from "./types";

export class Scanv2Db {
  private readonly dbName: string = "";
  private db: any;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.db = new Dexie(this.dbName);
    this.db.version(1).stores({
      issues: "id",
      issueIndex: "id,path,criticality",
      pathsIndex: "id",
      metadata: ",summary, scanVersion", // tmp
      operations: "[path+method]", // tmp
    });
  }

  async init(): Promise<void> {
    try {
      await this.openDb();
      await this.clearDb();
    } catch (e: any) {
      throw new Error(`Failed to initialize db: ${e}`);
    }
  }

  async openDb(): Promise<void> {
    await this.db.open();
  }

  close(): void {
    // disableAutoOpen: false - allows us to open db instantly after closing
    this.db.close({ disableAutoOpen: false });
  }

  async clearDb(): Promise<void> {
    await this.db.issues.clear();
    await this.db.issueIndex.clear();
    await this.db.pathsIndex.clear();
    await this.db.metadata.clear();
    await this.db.operations.clear();
    // await this.db.responseKeysIndex.clear();
    // await this.db.responseDescriptionsIndex.clear();
    // await this.db.injectionDescriptionsIndex.clear();
    // await this.db.injectionKeysIndex.clear();
    // await this.db.jsonPointersIndex.clear();
  }

  async bulkPutIssues(issues: { id: number; issue: any }[]): Promise<void> {
    await this.db.issues.bulkPut(issues);
  }

  async bulkPutIssueIndex(
    index: { id: number; path: number; method: number; criticality: number }[]
  ): Promise<void> {
    await this.db.issueIndex.bulkPut(index);
  }

  async bulkPutIndex(indexName: string, index: { id: number; value: string }[]): Promise<void> {
    switch (indexName) {
      case "paths":
        await this.db.pathsIndex.bulkPut(index);
        break;
      // case "responseKeys":
      //   await this.db.responseKeysIndex.bulkPut(index);
      //   break;
      // case "responseDescriptions":
      //   await this.db.responseDescriptionsIndex.bulkPut(index);
      //   break;
      // case "injectionDescriptions":
      //   await this.db.injectionDescriptionsIndex.bulkPut(index);
      //   break;
      // case "injectionKeys":
      //   await this.db.injectionKeysIndex.bulkPut(index);
      //   break;
      // case "jsonPointers":
      //   await this.db.jsonPointersIndex.bulkPut(index);
      //   break;
      // case "contentTypes":
      //   await this.db.contentTypesIndex.bulkPut(index);
      //   break;
      default:
        throw new Error(`Unknown index name: ${indexName}`);
    }
  }

  // async getMedtadataObject(): Promise<Metadata> {
  //   return null as any;
  // }

  async getIssue(id: string): Promise<any> {
    return null as any;
  }

  async getPathsKeys(): Promise<any> {
    // looks like this is not used
  }

  async getPaths(
    page: number = 1,
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter(),
    isFullReport: boolean = false
  ): Promise<PaginationResponse> {
    return {
      list: [],
      filteredItems: 0,
      totalPages: 0,
      totalItems: 0,
    };
  }

  async getIssues(
    page: number,
    perPage: number,
    sortOrder: ParserFieldSortOrder,
    searchFilter: string = "",
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter(),
    isFullReport: boolean = false
  ): Promise<PaginationResponse> {
    console.time("Reading index");

    const orderBy = sortOrder?.fieldName || "path";

    console.log("Sort order:", orderBy, sortOrder?.order);

    const index = await this.db.issueIndex.orderBy(orderBy).toArray();

    console.log("Index length:", index.length);

    if (sortOrder?.order === SortOrder.Desc) {
      index.reverse();
    }

    console.timeEnd("Reading index");

    const found: any = [];
    console.time("Reading issues from index");
    for (const item of index) {
      found.push(item);
    }
    console.timeEnd("Reading issues from index");
    console.log("found", found[0]);

    function paginate(array: any[], page: number, perPage: number): any[] {
      const start = (page - 1) * perPage;
      const end = start + perPage;
      return array.slice(start, end);
    }

    const foundPage = paginate(found, page, perPage);
    const totalPages = Math.ceil(found.length / perPage);

    const fullPage: any[] = [];

    for (const index of foundPage) {
      const data = await this.db.issues.get(index.id);
      console.log("reading issue:", index.id, data);
      const fullIssue = await this.makeIssue(data.issue, index);
      fullPage.push(fullIssue);
    }

    console.log("Full page:", fullPage);

    return {
      list: fullPage,
      filteredItems: found.length,
      totalPages: totalPages,
      totalItems: fullPage.length,
    };
  }

  async makeIssue(issue: any, index: any) {
    for (const apiResponseAnalysis of issue.apiResponseAnalysis || []) {
      const result = [];
      const responseKey = await this.db.responseKeysIndex.get(apiResponseAnalysis.responseKey);
      const responseDescription = await this.db.responseDescriptionsIndex.get(
        apiResponseAnalysis.responseDescription
      );
      result.push({
        responseKey: responseKey.value,
        responseDescription: responseDescription.value,
      });
      issue.responseAnalysisList = result;
    }

    issue.path = (await this.db.pathsIndex.get(index.path)).value;

    const methods: Record<number, string> = {
      1: "GET",
      2: "POST",
      3: "PUT",
      4: "DELETE",
      5: "PATCH",
      6: "HEAD",
      7: "OPTIONS",
      8: "TRACE",
    };

    issue.method = methods[index.method];

    console.log("Issue:", issue);

    return issue;
  }

  async getSkippedIssues(
    page: number,
    perPage: number,
    searchFilter: string = "",
    scanIssuesFilter: ScanReportIntegralFilter = new ScanReportIntegralFilter(),
    isFullReport: boolean = false
  ): Promise<PaginationResponse> {
    return {
      list: [],
      filteredItems: 0,
      totalPages: 0,
      totalItems: 0,
    };
  }

  // todo: redesign me
  async getReport(): Promise<any> {
    const operations = await this.db.operations.toArray();
    const summary = await this.db.metadata.get(["summary"]);
    const scanVersion = await this.db.metadata.get(["scanVersion"]);
    return { operations, summary, scanVersion };
  }

  async updateMetadataItem(key: string, value: any): Promise<void> {
    return await this.db.metadata.put(value, [key]);
  }

  // todo: use bulk later
  async addOperations(operations: any[]): Promise<void> {
    for (const operation of operations) {
      await this.db.operations.add({ ...operation });
    }
  }
}
