//// @ts-nocheck

import { TestLogReportWithLocation } from "../app/scan/slice";
import { Parser } from "./parser";
import {
  initDb,
  onCloseArray,
  onCloseObject,
  onKey,
  onOpenArray,
  onOpenObject,
  onParsingEnd,
  onReady,
  onValue,
  processMetadata,
} from "./scanv1-processor";
import {
  getScanv2Db,
  initScanv2Db,
  onCloseArrayForScanV2,
  onCloseObjectForScanV2,
  onKeyForScanV2,
  onOpenArrayForScanV2,
  onOpenObjectForScanV2,
  onParsingEndForScanV2,
  onReadyForScanV2,
  onValueForScanV2,
} from "./scanv2-processor";

import { makeParser } from "@xliic/streaming-parser/src/index";

let parser: Parser;
let parser2: any;

const worker: Worker = self as any;

worker.addEventListener("message", async ({ data: { type, dbName, progress, chunkText } }) => {
  if (type === "init") {
    initProcessReport(dbName)
      .then(() => {
        worker.postMessage({
          command: "sendInitDbComplete",
          payload: { status: true, message: "" },
        });
      })
      .catch((e: any) => {
        worker.postMessage({
          command: "sendInitDbComplete",
          payload: {
            status: false,
            message: `Failed to connect to the database: ${e.message}`,
          },
        });
      });
  } else if (type === "parse") {
    const done = progress === 1.0;
    processReport(done, chunkText).then(() => {
      worker.postMessage({
        command: "sendParseChunkComplete",
        payload: undefined,
      });
    });
  }
});

export async function initProcessReport(dbName: string): Promise<void> {
  if (dbName === "vscode.scan.v2.db") {
    //debugger;

    parser2 = makeParser({
      // "$.scanVersion.value()" do not work!!!
      // "$.operations.*.conformanceRequestsResults.*.deep()" access to 2nd parent

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

    // parser = new Parser({
    //   onValue: onValueForScanV2,
    //   onKey: onKeyForScanV2,
    //   onOpenObject: onOpenObjectForScanV2,
    //   onCloseObject: onCloseObjectForScanV2,
    //   onOpenArray: onOpenArrayForScanV2,
    //   onCloseArray: onCloseArrayForScanV2,
    //   onEnd: onEndForScanV2,
    //   onError: onError,
    //   onReady: onReadyForScanV2,
    // });
  } else {
    parser = new Parser({
      onValue,
      onKey,
      onOpenObject,
      onCloseObject,
      onOpenArray,
      onCloseArray,
      onEnd,
      onError,
      onReady,
    });
  }
  try {
    return dbName === "vscode.scan.v2.db" ? await initScanv2Db(dbName) : await initDb(dbName);
  } catch (err: any) {
    return await throwError(err.message);
  }
}

export async function processReport(done: boolean, value: string): Promise<void> {
  await parser.write(value as string);
  if (done) {
    await parser.close();
  }
}

export async function processReport2(done: boolean, value: string): Promise<void> {
  await parser2.chunk(value as string);
  // todo: need to close?
  if (done) {
    await parser2.end();
  }
}

async function processReport_orig(url: string, dbName: string): Promise<void> {
  try {
    await initDb(dbName);
  } catch (err: any) {
    await throwError(err.message);
    return;
  }

  const parser: Parser = new Parser({
    onValue,
    onKey,
    onOpenObject,
    onCloseObject,
    onOpenArray,
    onCloseArray,
    onEnd,
    onError,
    onReady,
  });

  await fetch(`${url}/meta`)
    .then((response) => response.json())
    .then((metadata: any) => {
      processMetadata(metadata);
    })
    .catch((e: any) => {
      throwError(e.message);
      return;
    });

  await fetch(`${url}/content`)
    .then(async (response: Response) => {
      const reader = response?.body?.pipeThrough(new TextDecoderStream() as any).getReader();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          await parser.write(value as string);
        }

        await parser.close();
        reader.releaseLock();
      }
    })
    .then(() => {})
    .catch((e: any) => {
      throwError(e.message);
      return;
    });
}

async function onEnd(): Promise<void> {
  return new Promise<void>(async (resolve) => {
    onParsingEnd();
    worker.postMessage({ data: "Report parsed" });
    resolve();
  });
}

async function onEndForScanV2(): Promise<void> {
  return new Promise<void>(async (resolve) => {
    onParsingEndForScanV2();
    //worker.postMessage({ data: "Report parsed" });
    resolve();
  });
}

async function onError(e: any): Promise<void> {
  return new Promise<void>(async (reject) => {
    await throwError(`JSON parser error: ${e.message}`);
    reject();
  });
}

async function throwError(errorText: string): Promise<void> {
  return new Promise<void>((reject) => {
    worker.postMessage({ error: errorText });
    reject();
  });
}
