//// @ts-nocheck

import { TestLogReportWithLocation } from "../app/scan/slice";
import { makeParser } from "@xliic/streaming-parser/src/index";
import { getScanv2Db, initScanv2Db } from "./scanv2-processor";

let parser2: any;

export async function initProcessReport(dbName: string): Promise<void> {
  parser2 = makeParser({
    // "$.scanVersion.value()" do not work!!!
    // "$.operations.*.conformanceRequestsResults.*.deep()" access to 2nd parent
    // async todo: save into mem, bulk update

    "$.shallow()": (value: any) => {
      const dbService = getScanv2Db();
      dbService.updateMetadataItem("scanVersion", value.scanVersion);
      //console.info("scanVersion = " + value);
    },

    "$.summary.shallow()": (value: any) => {
      const dbService = getScanv2Db();
      dbService.updateMetadataItem("summary", value);
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
          dbService.addMethodNotAllowedIssue(issue);
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
          dbService.addMethodNotAllowedIssue(issue);
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
          dbService.addMethodNotAllowedIssue(issue);
        }
        delete op["customRequestsResults"];
      }
      dbService.addOperation({
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
      //console.info("mna = " + value + ", path " + path + ", method " + method);
      const dbService = getScanv2Db();
      const issue: TestLogReportWithLocation = {
        ...value,
        path,
        method,
        testKey: value?.test?.key,
      };
      dbService.addMethodNotAllowedIssue(issue);
    },
  });

  try {
    return await initScanv2Db(dbName);
  } catch (err: any) {
    return await throwError(err.message);
  }
}

export function processReport2(done: boolean, value: string): void {
  parser2.chunk(value as string);
  if (done) {
    parser2.end();
  }
}

async function throwError(errorText: string): Promise<void> {
  return new Promise<void>((reject) => {
    //worker.postMessage({ error: errorText });
    reject();
  });
}
