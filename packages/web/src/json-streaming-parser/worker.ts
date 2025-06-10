//// @ts-nocheck

import { TestLogReportWithLocation } from "../app/scan/slice";
import { IndexStore, makeParser, Parser } from "@xliic/streaming-parser/src/index";
import {
  addOperations,
  getScanv2Db,
  initScanv2Db,
  onIssue,
  onParsingEnd,
  saveIndex,
  saveIssues,
  saveMetadata,
} from "./scanv2-processor";

let parser2: Parser;
const indexHandler = new IndexStore(["paths"]);
let operations: any[] = [];
let scanVersion: string;
let summary: any;

export async function initProcessReport(dbName: string): Promise<void> {
  parser2 = makeParser({
    "$.shallow()": (value: any) => {
      scanVersion = value.scanVersion;
    },

    "$.summary.shallow()": (value: any) => {
      summary = value;
    },

    "$.operations.*.deep()": (value: any, [operationId]: [string]) => {
      //console.info("op = " + value + ", id " + operationId);
      const op = value;
      const path = op.path;
      const method = op.method;
      const dbService = getScanv2Db();
      if (op["conformanceRequestsResults"]) {
        for (const res of op["conformanceRequestsResults"]) {
          const issue: TestLogReportWithLocation = {
            ...res,
            path,
            method,
            testKey: res?.test?.key,
          };
          const pathIndex = indexHandler.put("paths", path);
          onIssue(pathIndex, method, issue);
        }
        delete op["conformanceRequestsResults"];
      }
      if (op["authorizationRequestsResults"]) {
        for (const res of op["authorizationRequestsResults"]) {
          const issue: TestLogReportWithLocation = {
            ...res,
            path,
            method,
            testKey: res?.test?.key,
          };
          const pathIndex = indexHandler.put("paths", path);
          onIssue(pathIndex, method, issue);
        }
        delete op["authorizationRequestsResults"];
      }
      if (op["customRequestsResults"]) {
        for (const res of op["customRequestsResults"]) {
          const issue: TestLogReportWithLocation = {
            ...res,
            path,
            method,
            testKey: res?.test?.key,
          };
          const pathIndex = indexHandler.put("paths", path);
          onIssue(pathIndex, method, issue);
        }
        delete op["customRequestsResults"];
      }
      operations.push({
        ...op,
        operationId,
      });
    },

    // "$.operations.*.conformanceRequestsResults.*.deep()": (
    //   value: any,
    //   [path, method]: [string, string]
    // ) => {
    //   console.info("mna = " + value + ", path " + path + ", method " + method);
    //   // const dbService = getScanv2Db();
    //   // const issue: TestLogReportWithLocation = {
    //   //   ...value,
    //   //   path,
    //   //   method,
    //   //   testKey: value?.test?.key,
    //   // };
    //   // dbService.addMethodNotAllowedIssue(issue);
    // },

    "$.methodNotAllowed.*.*.conformanceRequestsResults.*.deep()": (
      value: any,
      [path, method]: [string, string]
    ) => {
      const issue: TestLogReportWithLocation = {
        ...value,
        path,
        method,
        testKey: value?.test?.key,
      };
      const pathIndex = indexHandler.put("paths", path);
      onIssue(pathIndex, method, issue);
    },
  });

  try {
    return await initScanv2Db(dbName);
  } catch (err: any) {
    return await throwError(err.message);
  }
}

export async function processReport2(done: boolean, value: string): Promise<void> {
  parser2.chunk(value as string);
  if (done) {
    await saveIssues();
    await saveMetadata(scanVersion, summary);
    await addOperations(operations);
    for (const bucket of indexHandler.getBuckets()) {
      await saveIndex(bucket, indexHandler.entries(bucket));
    }
    parser2.end();
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
