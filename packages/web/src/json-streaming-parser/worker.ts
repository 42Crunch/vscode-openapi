//// @ts-nocheck

import { IndexStore, makeParser, Parser } from "@xliic/streaming-parser/src/index";
import {
  addOperations,
  initScanv2Db,
  onIssue,
  onOperationId,
  onOperationIssue,
  onParsingEnd,
  saveIndex,
  saveIssues,
  saveMetadata,
} from "./scanv2-processor";

let parser: Parser;
const indexHandler = new IndexStore(["paths"]);
let operations: any[] = [];
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
      onOperationId(operationId, value.path, value.method.toLowerCase());
    },

    "$.operations.*.deep()": (value: any, [operationId]: [string]) => {
      delete value["conformanceRequestsResults"];
      delete value["authorizationRequestsResults"];
      delete value["customRequestsResults"];
      operations.push({ ...value, operationId }); // todo: onOperation()
    },

    "$.operations.*.conformanceRequestsResults.*.deep()": (value: any, [operationId]: [string]) => {
      onOperationIssue(operationId, value);
    },

    "$.operations.*.authorizationRequestsResults.*.deep()": (
      value: any,
      [operationId]: [string]
    ) => {
      onOperationIssue(operationId, value);
    },

    "$.operations.*.customRequestsResults.*.deep()": (value: any, [operationId]: [string]) => {
      onOperationIssue(operationId, value);
    },

    "$.methodNotAllowed.*.*.conformanceRequestsResults.*.deep()": (
      value: any,
      [path, method]: [string, string]
    ) => {
      const pathIndex = indexHandler.put("paths", path);
      onIssue(pathIndex, method, value);
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
  if (done) {
    await saveIssues(indexHandler);
    await saveMetadata(scanVersion, summary);
    await addOperations(operations);
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
