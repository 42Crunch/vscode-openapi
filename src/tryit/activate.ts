/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { parseJsonPointer, Path, simpleClone } from "@xliic/preserving-json-yaml-parser";
import { Bundle } from "../types";
import { Cache } from "../cache";
import { HttpMethod } from "@xliic/common/http";
import { BundledOpenApiSpec } from "@xliic/common/oas30";
import { TryItWebView } from "./view";
import { TryItCodelensProvider } from "./lens";
import { Configuration } from "../configuration";

type BundleDocumentVersions = Record<string, number>;

type TryIt = {
  documentUri: vscode.Uri;
  path: string;
  method: HttpMethod;
  versions: BundleDocumentVersions;
};

const selectors = {
  json: { language: "json" },
  jsonc: { language: "jsonc" },
  yaml: { language: "yaml" },
};

export function activate(
  context: vscode.ExtensionContext,
  cache: Cache,
  configuration: Configuration
) {
  let tryIt: TryIt | null = null;
  let previewUpdateDelay: number;

  configuration.track<number>("previewUpdateDelay", (delay: number) => {
    previewUpdateDelay = delay;
  });

  function debounce(func: Function) {
    let timer: NodeJS.Timeout;
    return (...args: any) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(null, args);
      }, previewUpdateDelay);
    };
  }

  const debouncedTryIt = debounce(showTryIt);

  const view = new TryItWebView(context.extensionPath);

  cache.onDidChange(async (document: vscode.TextDocument) => {
    const uri = document.uri.toString();
    if (tryIt !== null && tryIt.documentUri.toString() === uri) {
      const bundle = await cache.getDocumentBundle(document);
      if (bundle && !("errors" in bundle)) {
        const versions = getBundleVersions(bundle);
        if (isBundleVersionsDifferent(versions, tryIt.versions)) {
          tryIt.versions = versions;
          debouncedTryIt(view, bundle, tryIt.path, tryIt.method);
        }
      }
    }
  });

  vscode.commands.registerCommand(
    "openapi.tryOperation",
    async (uri: vscode.Uri, path: string, method: HttpMethod) => {
      tryIt = { documentUri: uri, path, method, versions: {} };
      startTryIt(view, cache, tryIt);
    }
  );

  const tryItCodeLensProvider = new TryItCodelensProvider(cache);
  for (const selector of Object.values(selectors)) {
    vscode.languages.registerCodeLensProvider(selector, tryItCodeLensProvider);
  }
}

async function startTryIt(view: TryItWebView, cache: Cache, tryIt: TryIt) {
  const document = await vscode.workspace.openTextDocument(tryIt.documentUri);
  const bundle = await cache.getDocumentBundle(document);
  if (!bundle || "errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    vscode.window.showErrorMessage("Failed to try it, check OpenAPI file for errors.");
  } else {
    tryIt.versions = getBundleVersions(bundle);
    await view.show();
    showTryIt(view, bundle, tryIt.path, tryIt.method);
  }
}

async function showTryIt(view: TryItWebView, bundle: Bundle, path: string, method: HttpMethod) {
  if (view.isActive()) {
    const oas = extractSingleOperation(method as HttpMethod, path as string, bundle.value);
    await view.show();
    view.sendTryOperation({
      oas,
      path,
      method,
    });
  }
}

function isBundleVersionsDifferent(
  versions: BundleDocumentVersions,
  otherVersions: BundleDocumentVersions
) {
  for (const [uri, version] of Object.entries(versions)) {
    if (otherVersions[uri] !== version) {
      return true;
    }
  }
  if (Object.keys(otherVersions).length !== Object.keys(versions).length) {
    return true;
  }
  return false;
}

function getBundleVersions(bundle: Bundle) {
  const versions: BundleDocumentVersions = {
    [bundle.document.uri.toString()]: bundle.document.version,
  };
  bundle.documents.forEach((document) => {
    versions[document.uri.toString()] = document.version;
  });
  return versions;
}

function extractSingleOperation(method: HttpMethod, path: string, oas: any): BundledOpenApiSpec {
  const visited = new Set<string>();
  crawl(oas, oas["paths"][path][method], visited);
  const cloned: any = simpleClone(oas);
  delete cloned["paths"];
  delete cloned["components"]["schemas"];
  cloned["paths"] = { [path]: { [method]: oas["paths"][path][method] } };
  if (oas["paths"][path]["parameters"]) {
    cloned["paths"][path]["parameters"] = oas["paths"][path]["parameters"];
  }
  copyByPointer(oas, cloned, Array.from(visited));
  return cloned as BundledOpenApiSpec;
  //console.log("cloned", cloned, getPath(spec, ""));
}

function crawl(root: any, current: any, visited: Set<string>) {
  if (typeof current !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(current)) {
    if (key === "$ref") {
      const path = (<string>value).substring(1, (<string>value).length);
      visited.add(path);
      const ref = resolveRef(root, path);
      crawl(root, ref, visited);
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
