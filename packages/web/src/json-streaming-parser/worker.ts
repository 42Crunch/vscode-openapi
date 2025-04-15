// @ts-nocheck

import { Parser } from "./parser";
import {
  initDb,
  onKey,
  onValue,
  onOpenArray,
  onCloseArray,
  onOpenObject,
  onCloseObject,
  onReady,
  processMetadata,
  onParsingEnd,
} from "./scanv1-processor";

let parser: Parser;

const worker: Worker = self as any;

// worker.addEventListener("message", async ({ data: { url, dbName } }) => {
//   await processReport(url, dbName);
// });

export async function initProcessReport(dbName: string): Promise<void> {
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
  try {
    return await initDb(dbName);
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
