import { Scanv2Db } from "./scanv2.db";

let dbService: Scanv2Db;

export function getScanv2Db(): Scanv2Db {
  return dbService;
}

export async function initScanv2Db(dbName: string): Promise<void> {
  dbService = new Scanv2Db(dbName);

  return await dbService
    .init()
    // eslint-disable-next-line no-console
    .then(() =>
      console.log("%c Connected to the database", "text-transform: uppercase; color: green")
    )
    .catch((e: any) => {
      throw new Error(`Failed to connect to the database: ${e.message}`);
    });
}

export function onParsingEnd(): void {
  dbService.close();
}

export async function saveIndex(indexName: string, objs: { id: number; value: string }[]) {
  await dbService.bulkPutIndex(indexName, objs);
}

const issues: { id: number; issue: any }[] = [];
const index: { id: number; path: number; method: number; criticality: number }[] = [];

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

let issueCount = 0;

export function onIssue(path: number, method: string, issue: any) {
  issues.push({
    id: issueCount,
    issue,
  });

  if (!issue.outcome) {
    console.info();
  }

  index.push({
    id: issueCount,
    path,
    method: methods[method],
    criticality: issue.outcome.criticality,
  });

  issueCount++;
}

export async function saveIssues() {
  await dbService.bulkPutIssues(issues);
  await dbService.bulkPutIssueIndex(index);

  // Clear the issues array after saving, but keep issueCount to avoid reusing IDs
  issues.length = 0;
  index.length = 0;
}

export async function saveMetadata(scanVersion: string, summary: any) {
  await dbService.updateMetadataItem("scanVersion", scanVersion);
  await dbService.updateMetadataItem("summary", summary);
}

export async function addOperations(operations: any[]) {
  await dbService.addOperations(operations);
}
