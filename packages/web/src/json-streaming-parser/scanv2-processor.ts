import { IndexStore } from "@xliic/streaming-parser/src";
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
  opIdsRecord = {};
  index.length = 0;
  issues.length = 0;
  operations.length = 0;
  dbService.close();
}

export async function saveIndex(indexName: string, objs: { id: number; value: string }[]) {
  await dbService.bulkPutIndex(indexName, objs);
}

const issues: { id: number; issue: any }[] = [];
const operations: { id: number; operation: any }[] = [];
const index: {
  id: number;
  path: string;
  method: string;
  criticality: number;
  issueType: number;
  operationId: string;
}[] = [];

let opIdsRecord: Record<string, { id: number; path: string; method: string }> = {};

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

const issueTypes: Record<string, number> = {
  methodNotAllowed: 1,
  conformance: 2,
  authorization: 3,
  custom: 4,
  happyPath: 5,
};

let issueCount = 0;
let operationCount = 0;

export function onOperationIssue(operationId: string, issueType: string, issue: any) {
  issues.push({
    id: issueCount,
    issue,
  });

  index.push({
    id: issueCount,
    path: "",
    method: "",
    criticality: issue.outcome.criticality,
    issueType: issueTypes[issueType],
    operationId,
  });

  issueCount++;
}

export function onOperation(operationId: string, operation: any) {
  operations.push({
    id: operationCount,
    operation,
  });

  opIdsRecord[operationId] = {
    id: operationCount,
    path: operation.path,
    method: operation.method.toLowerCase(),
  };

  operationCount++;
}

export function onIssue(path: string, method: string, issueType: string, issue: any) {
  issues.push({
    id: issueCount,
    issue,
  });

  index.push({
    id: issueCount,
    path,
    method,
    criticality: issue.outcome.criticality,
    issueType: issueTypes[issueType],
    operationId: "",
  });

  issueCount++;
}

export async function saveOperations() {
  if (operations.length > 0) {
    await dbService.bulkPutOperations(operations);
    // Clear the operations array after saving, but keep operationsCount to avoid reusing IDs
    operations.length = 0;
  }
}

export async function saveIssues() {
  if (issues.length > 0) {
    await dbService.bulkPutIssues(issues);
    // Clear the issues array after saving, but keep issueCount to avoid reusing IDs
    issues.length = 0;
  }
}

export async function saveIssueIndex(indexHandler: IndexStore) {
  // Some index contains only operationId but not path and method
  for (const entry of index) {
    if (entry.operationId && entry.operationId in opIdsRecord) {
      const { path, method } = opIdsRecord[entry.operationId];
      entry.path = path;
      entry.method = method;
    }
  }
  // Sort path ASC
  index.sort((a, b) => a.path.localeCompare(b.path));
  const indexToSave: {
    id: number;
    path: number;
    method: number;
    criticality: number;
    issueType: number;
    operation: number;
  }[] = [];
  for (const entry of index) {
    const id = entry.operationId in opIdsRecord ? opIdsRecord[entry.operationId].id : -1;
    indexToSave.push({
      id: entry.id,
      path: indexHandler.put("paths", entry.path),
      method: methods[entry.method],
      criticality: entry.criticality,
      issueType: entry.issueType,
      operation: id,
    });
  }
  await dbService.bulkPutIssueIndex(indexToSave);
  index.length = 0;
  opIdsRecord = {};
}

export async function saveMetadata(scanVersion: string, summary: any) {
  await dbService.updateMetadataItem("scanVersion", scanVersion);
  await dbService.updateMetadataItem("summary", summary);
}

// export async function addOperations(operations: any[]) {
//   await dbService.addOperations(operations);
// }
