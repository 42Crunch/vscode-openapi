/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { parseJsonPointer, Path, simpleClone } from "@xliic/preserving-json-yaml-parser";
import { Preferences } from "@xliic/common/prefs";
import { Bundle } from "../types";
import { Cache } from "../cache";
import { HttpMethod } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { TryItWebView } from "./view";
import { TryItCodelensProvider } from "./lens";
import { Configuration } from "../configuration";
import { EnvStore } from "../envstore";

type BundleDocumentVersions = Record<string, number>;

type TryIt = {
  documentUri: vscode.Uri;
  path: string;
  method: HttpMethod;
  versions: BundleDocumentVersions;
  preferredMediaType?: string;
  preferredBodyValue?: unknown;
};

const selectors = {
  json: { language: "json" },
  jsonc: { language: "jsonc" },
  yaml: { language: "yaml" },
};

export function activate(
  context: vscode.ExtensionContext,
  cache: Cache,
  configuration: Configuration,
  envStore: EnvStore,
  prefs: Record<string, Preferences>
) {
  let tryIt: TryIt | null = null;
  let previewUpdateDelay: number;

  configuration.track<number>("previewUpdateDelay", (delay: number) => {
    previewUpdateDelay = delay;
  });

  function debounce<A extends unknown[], R>(fn: (...args: A) => R) {
    return (...args: A): Promise<R> => {
      let timer: NodeJS.Timeout;
      return new Promise((resolve) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          resolve(fn(...args));
        }, previewUpdateDelay);
      });
    };
  }

  const debouncedTryIt = debounce(showTryIt);

  const view = new TryItWebView(context.extensionPath, cache, envStore, prefs);

  cache.onDidChange(async (document: vscode.TextDocument) => {
    const uri = document.uri.toString();
    if (tryIt !== null && tryIt.documentUri.toString() === uri) {
      const bundle = await cache.getDocumentBundle(document);
      if (bundle && !("errors" in bundle)) {
        const versions = getBundleVersions(bundle);
        if (isBundleVersionsDifferent(versions, tryIt.versions)) {
          tryIt.versions = versions;
          debouncedTryIt(view, document, bundle, tryIt.path, tryIt.method);
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

  vscode.commands.registerCommand(
    "openapi.tryOperationWithExample",
    async (
      uri: vscode.Uri,
      path: string,
      method: HttpMethod,
      preferredMediaType: string,
      preferredBodyValue: unknown
    ) => {
      tryIt = {
        documentUri: uri,
        path,
        method,
        versions: {},
        preferredMediaType,
        preferredBodyValue,
      };
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
    await view.sendColorTheme(vscode.window.activeColorTheme);
    await showTryIt(
      view,
      document,
      bundle,
      tryIt.path,
      tryIt.method,
      tryIt.preferredMediaType,
      tryIt.preferredBodyValue
    );
  }
}

async function showTryIt(
  view: TryItWebView,
  document: vscode.TextDocument,
  bundle: Bundle,
  path: string,
  method: HttpMethod,
  preferredMediaType?: string,
  preferredBodyValue?: unknown
) {
  if (view.isActive()) {
    const oas = extractSingleOperation(method as HttpMethod, path as string, bundle.value);
    await view.show();
    const insecureSslHostnames =
      vscode.workspace.getConfiguration("openapi").get<string[]>("tryit.insecureSslHostnames") ||
      [];
    view.sendTryOperation(document, {
      oas,
      path,
      method,
      preferredMediaType,
      preferredBodyValue,
      config: {
        insecureSslHostnames,
      },
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

function extractSingleOperation(
  method: HttpMethod,
  path: string,
  oas: any
): BundledSwaggerOrOasSpec {
  const visited = new Set<string>();
  crawl(oas, oas["paths"][path][method], visited);
  if (oas["paths"][path]["parameters"]) {
    crawl(oas, oas["paths"][path]["parameters"], visited);
  }
  const cloned: any = simpleClone(oas);
  delete cloned["paths"];
  delete cloned["components"];
  delete cloned["definitions"];

  // copy single path and path parameters
  cloned["paths"] = { [path]: { [method]: oas["paths"][path][method] } };
  if (oas["paths"][path]["parameters"]) {
    cloned["paths"][path]["parameters"] = oas["paths"][path]["parameters"];
  }
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
