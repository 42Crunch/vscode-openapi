/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { PlatformContext } from "../types";
import { parseJsonPointer, Path, simpleClone, stringify } from "@xliic/preserving-json-yaml-parser";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { HttpMethod } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { ScanWebView } from "./view";

export default (
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  view: ScanWebView
) => {
  vscode.commands.registerTextEditorCommand(
    "openapi.platform.editorRunSingleOperationScan",
    async (
      editor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      uri: string,
      path: string,
      method: HttpMethod
    ): Promise<void> => {
      try {
        await editorRunSingleOperationScan(editor, edit, cache, store, view, uri, path, method);
      } catch (ex: any) {
        if (
          ex?.response?.statusCode === 409 &&
          ex?.response?.body?.code === 109 &&
          ex?.response?.body?.message === "limit reached"
        ) {
          vscode.window.showErrorMessage(
            "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
          );
        } else {
          vscode.window.showErrorMessage("Failed to scan: " + ex.message);
        }
      }
    }
  );
};

async function editorRunSingleOperationScan(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  cache: Cache,
  store: PlatformStore,
  view: ScanWebView,
  uri: string,
  path: string,
  method: HttpMethod
): Promise<void> {
  await view.show();
  await view.sendColorTheme(vscode.window.activeColorTheme);

  const bundle = await cache.getDocumentBundle(editor.document);
  if (bundle && !("errors" in bundle)) {
    //const oas = extractSingleOperation(method as HttpMethod, path as string, bundle.value);
    // extracting the entire path here, 'cause scan will generate requests
    // for all possible HTTP Verbs and test the responses against the OAS
    const oas = extractSinglePath(path as string, bundle.value);
    const rawOas = stringify(oas);

    const api = await store.createTempApi(rawOas);

    const audit = await store.getAuditReport(api.desc.id);
    if (audit?.openapiState !== "valid") {
      await store.deleteApi(api.desc.id);
      throw new Error(
        "OpenAPI has failed Security Audit. Please run API Security Audit, fix the issues and try running the Scan again."
      );
    }

    await store.createDefaultScanConfig(api.desc.id);

    const configs = await store.getScanConfigs(api.desc.id);

    const c = await store.readScanConfig(configs[0].scanConfigurationId);

    const config = JSON.parse(Buffer.from(c.scanConfiguration, "base64").toString("utf-8"));

    await store.deleteApi(api.desc.id);

    if (config !== undefined) {
      await view.sendScanOperation(editor.document, {
        documentUrl: editor.document.uri.toString(),
        oas: oas as BundledSwaggerOrOasSpec,
        rawOas: rawOas,
        path: path as string,
        method: method as HttpMethod,
        config,
      });
    }
  }
}

function extractSinglePath(path: string, oas: any): BundledSwaggerOrOasSpec {
  const visited = new Set<string>();
  crawl(oas, oas["paths"][path], visited);
  if (oas["paths"][path]["parameters"]) {
    crawl(oas, oas["paths"][path]["parameters"], visited);
  }
  const cloned: any = simpleClone(oas);
  delete cloned["paths"];
  delete cloned["components"];
  // copy single path and path parameters
  cloned["paths"] = { [path]: oas["paths"][path] };

  // copy security schemes
  if (oas?.["components"]?.["securitySchemes"]) {
    cloned["components"] = { securitySchemes: oas["components"]["securitySchemes"] };
  }
  copyByPointer(oas, cloned, Array.from(visited));
  return cloned as BundledSwaggerOrOasSpec;
}

function crawl(root: any, current: any, visited: Set<string>) {
  if (current === null || typeof current !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(current)) {
    if (key === "$ref") {
      const path = (<string>value).substring(1, (<string>value).length);
      if (!visited.has(path)) {
        visited.add(path);
        const ref = resolveRef(root, path);
        crawl(root, ref, visited);
      }
    } else {
      crawl(root, value, visited);
    }
  }
}

function resolveRef(root: any, pointer: string) {
  const path = parseJsonPointer(pointer);
  let current = root;
  for (let i = 0; i < path.length; i++) {
    current = current[path[i]];
  }
  return current;
}

function copyByPointer(src: any, dest: any, pointers: string[]) {
  const sortedPointers = [...pointers];
  sortedPointers.sort();
  for (const pointer of sortedPointers) {
    const path = parseJsonPointer(pointer);
    copyByPath(src, dest, path);
  }
}

function copyByPath(src: any, dest: any, path: Path): void {
  let currentSrc = src;
  let currentDest = dest;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    currentSrc = currentSrc[key];
    if (currentDest[key] === undefined) {
      if (Array.isArray(currentSrc[key])) {
        currentDest[key] = [];
      } else {
        currentDest[key] = {};
      }
    }
    currentDest = currentDest[key];
  }
  const key = path[path.length - 1];
  // check if the last segment of the path that is being copied is already set
  // which might be the case if we've copied the parent of the path already
  if (currentDest[key] === undefined) {
    currentDest[key] = currentSrc[key];
  }
}
