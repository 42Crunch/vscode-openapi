import { TestLogReportWithLocation } from "../app/scan/slice";
import { Scanv2Db } from "./scanv2.db";

interface StackEntry {
  type: "object" | "array";
  value: any;
  expectKey: boolean;
  key?: string;
}

let stack: StackEntry[] = [];
let dbService: Scanv2Db;

export function getScanv2Db(): Scanv2Db {
  return dbService;
}

// todo: fix to scanv2
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

export async function onValueForScanV2(value: any): Promise<void> {
  return new Promise<void>(async (resolve) => {
    //console.info("value=" + value);

    const currentContext = stack[stack.length - 1];

    if (currentContext.type === "object") {
      if (!currentContext.expectKey) {
        currentContext.value[currentContext.key!] = value;
        currentContext.expectKey = true;
      }
    } else if (currentContext.type === "array") {
      currentContext.value.push(value);
    }

    resolve();
  });
}

export async function onKeyForScanV2(key: string): Promise<void> {
  return new Promise<void>(async (resolve) => {
    // console.info("key=" + key);

    const currentContext = stack[stack.length - 1]; // todo: peek()?

    if (currentContext.type === "object") {
      if (currentContext.expectKey) {
        currentContext.key = key;
        currentContext.expectKey = false;
      }
    }
    // for arrays always value triggered

    resolve();
  });
}

export async function onOpenObjectForScanV2(key: string): Promise<void> {
  return new Promise<void>(async (resolve) => {
    //console.info("obj[o]=" + key);
    // Push new context onto stack
    stack.push({
      type: "object",
      value: {},
      expectKey: false, // ot incluses key already!
    });
    // todo: better
    stack[stack.length - 1].key = key;
    stack[stack.length - 1].value[key] = undefined;
    resolve();
  });
}

export async function onCloseObjectForScanV2(): Promise<void> {
  return new Promise<void>(async (resolve) => {
    //console.info("obj[c]");

    const completed = stack.pop()!;
    // Add to parent if stack isn't empty
    if (stack.length > 0) {
      addToParent(completed.value);
    } else {
      // This is the root value
      // we are ready here with completed.value;
    }

    //console.info("completed = " + completed);
    checkIfToSaveIntoDb(completed);

    resolve();
  });
}

export async function onOpenArrayForScanV2(): Promise<void> {
  return new Promise<void>(async (resolve) => {
    //console.info("arr[o]");
    // Push new context onto stack
    stack.push({
      type: "array",
      value: [],
      expectKey: false, // ot incluses key already!
    });
    resolve();
  });
}

export async function onCloseArrayForScanV2(): Promise<void> {
  return new Promise<void>(async (resolve) => {
    //console.info("arr[c]");

    const completed = stack.pop()!;
    // Add to parent if stack isn't empty
    if (stack.length > 0) {
      addToParent(completed.value);
    } else {
      // This is the root value
      // we are ready here with completed.value;
    }
    checkIfToSaveIntoDb(completed);

    resolve();
  });
}

export function onReadyForScanV2(): void {
  // USE IT IF YOU NEED
}

export function onParsingEndForScanV2(): void {
  dbService.close();
}

function addToParent(value: any): void {
  if (stack.length === 0) return;

  const parent = stack[stack.length - 1];
  if (parent.type === "object") {
    if (!parent.expectKey && parent.key) {
      parent.value[parent.key] = value;
      parent.expectKey = true;
    }
  } else if (parent.type === "array") {
    parent.value.push(value);
  }
}

async function checkIfToSaveIntoDb(completed: StackEntry) {
  if (completed.type === "object" && stack.length === 5) {
    // if (completed.value?.test?.key === "path-item-method-not-allowed-scan") {
    //   console.info("found completed = " + completed);
    // }
    if (stack[stack.length - 1].type === "array") {
      const confReqResults = stack[stack.length - 2];
      if (confReqResults.type === "object" && confReqResults.key === "conformanceRequestsResults") {
        const methodNotAllowed = stack[0];
        if (methodNotAllowed.type === "object" && methodNotAllowed.key === "methodNotAllowed") {
          const path = stack[1].key as string;
          const method = stack[2].key as string;
          const issue: TestLogReportWithLocation = {
            ...completed.value,
            path,
            method,
            testKey: completed.value?.test?.key,
          };
          console.info(
            "found issue completed = " + issue.path + ", " + issue.method + ", key " + issue.testKey
          );
          await dbService.addMethodNotAllowedIssue(issue);
        }
      }
    }

    // for (const path of Object.keys(scanReport?.methodNotAllowed || {})) {
    //   for (const method of HttpMethods) {
    //     const results = scanReport?.methodNotAllowed?.[path]?.[method]?.conformanceRequestsResults;
    //     for (const result of results || []) {
    //       issues.push({ ...result, path });
    //     }
    //   }
    // }
  }
}
