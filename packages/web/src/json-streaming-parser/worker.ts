import { IndexStore, makeParser, Parser } from "@xliic/streaming-parser/src/index";
import {
  initScanv2Db,
  onIssue,
  onOperation,
  onOperationIssue,
  onParsingEnd,
  saveIndex,
  saveIssueIndex,
  saveIssues,
  saveMetadata,
  saveOperations,
} from "./scanv2-processor";

let parser: Parser;
const indexHandler = new IndexStore(["paths"]);
let scanVersion: string;
let summary: any;

export async function initProcessReport(dbName: string): Promise<void> {
  parser = makeParser({
    "$.shallow()": (value: any) => {
      scanVersion = value.scanVersion;
    },

    "$.summary.shallow()": (value: any) => {
      summary = value;
    },

    "$.operations.*.shallow()": (value: any, [operationId]: [string]) => {
      onOperation(operationId, value);
    },

    "$.operations.*.scenarios.*.deep()": (value: any, [operationId]: [string]) => {
      onOperationIssue(operationId, "happyPath", value);
    },

    "$.operations.*.conformanceRequestsResults.*.deep()": (value: any, [operationId]: [string]) => {
      onOperationIssue(operationId, "conformance", value);
    },

    "$.operations.*.authorizationRequestsResults.*.deep()": (
      value: any,
      [operationId]: [string]
    ) => {
      onOperationIssue(operationId, "authorization", value);
    },

    "$.operations.*.customRequestsResults.*.deep()": (value: any, [operationId]: [string]) => {
      onOperationIssue(operationId, "custom", value);
    },

    "$.methodNotAllowed.*.*.conformanceRequestsResults.*.deep()": (
      value: any,
      [path, method]: [string, string]
    ) => {
      onIssue(path, method, "methodNotAllowed", value);
    },
  });

  try {
    return await initScanv2Db(dbName);
  } catch (err: any) {
    return await throwError(err.message);
  }
}

export async function processReport2(done: boolean, value: string): Promise<void> {
  parser.chunk(value as string);
  await saveIssues();
  await saveOperations();
  if (done) {
    // Save index here as we can't assign correct path index without sorting all the paths
    await saveIssueIndex(indexHandler);
    // Metadata and buckets don't take much time to be saved in db
    await saveMetadata(scanVersion, summary);
    for (const bucket of indexHandler.getBuckets()) {
      await saveIndex(bucket, indexHandler.entries(bucket));
    }
    parser.end();
    onParsingEnd();
    //await onEnd();
  }
}

async function throwError(errorText: string): Promise<void> {
  return new Promise<void>((reject) => {
    //worker.postMessage({ error: errorText });
    reject();
  });
}
