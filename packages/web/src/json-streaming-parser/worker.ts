//// @ts-nocheck

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

let parser: Parser;

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
    parser = new Parser({
      onValue: onValueForScanV2,
      onKey: onKeyForScanV2,
      onOpenObject: onOpenObjectForScanV2,
      onCloseObject: onCloseObjectForScanV2,
      onOpenArray: onOpenArrayForScanV2,
      onCloseArray: onCloseArrayForScanV2,
      onEnd: onEndForScanV2,
      onError: onError,
      onReady: onReadyForScanV2,
    });
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
