/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Preferences } from "@xliic/common/prefs";
import { Bundle } from "../types";
import { Cache } from "../cache";
import { HttpMethod } from "@xliic/openapi";
import { BundleDocumentVersions, TryItWebView } from "./view";
import { TryItCodelensProvider } from "./lens";
import { Configuration } from "../configuration";
import { EnvStore } from "../envstore";
import { DebounceDelay, debounce } from "../util/debounce";
import { OperationNode, PathNode } from "../outlines/nodes/paths";
import { TagChildNode, TagNode } from "../outlines/nodes/tags";
import { OperationIdNode } from "../outlines/nodes/operation-ids";
import { getPathAndMethod } from "../outlines/util";

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
): vscode.Disposable {
  let disposables: vscode.Disposable[] = [];

  const view = new TryItWebView(
    context.extensionPath,
    cache,
    envStore,
    prefs,
    configuration,
    context.secrets
  );

  const debounceDelay: DebounceDelay = { delay: 1000 };
  configuration.track<number>("previewUpdateDelay", (previewDelay: number) => {
    debounceDelay.delay = previewDelay;
  });
  const debouncedUpdateTryIt = debounce(updateTryIt, debounceDelay);

  cache.onDidChange(async (document: vscode.TextDocument) => {
    if (view?.isActive() && view.getTarget()?.document.uri.toString() === document.uri.toString()) {
      const bundle = await cache.getDocumentBundle(document);
      if (bundle && !("errors" in bundle)) {
        const versions = getBundleVersions(bundle);
        if (isBundleVersionsDifferent(versions, view.getTarget()!.versions)) {
          await debouncedUpdateTryIt(view, bundle, versions);
        }
      }
    }
  });

  const tryItCodeLensProvider = new TryItCodelensProvider(cache);

  function activateLens(enabled: boolean) {
    disposables.forEach((disposable) => disposable.dispose());
    if (enabled) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, tryItCodeLensProvider)
      );
    } else {
      disposables = [];
    }
  }

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (configuration.changed(e, "codeLens")) {
      activateLens(configuration.get("codeLens"));
    }
  });

  activateLens(configuration.get("codeLens"));

  vscode.commands.registerCommand(
    "openapi.tryOperation",
    async (document: vscode.TextDocument, path: string, method: HttpMethod) => {
      await startTryIt(document, cache, view, path, method);
    }
  );

  vscode.commands.registerCommand(
    "openapi.tryOperationWithExample",
    async (
      document: vscode.TextDocument,
      path: string,
      method: HttpMethod,
      preferredMediaType: string,
      preferredBodyValue: unknown
    ) => {
      await startTryIt(document, cache, view, path, method, preferredMediaType, preferredBodyValue);
    }
  );

  vscode.commands.registerCommand(
    "openapi.outlineTryOperation",
    async (node: OperationNode | TagChildNode | OperationIdNode) => {
      if (!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }
      const { path, method } = getPathAndMethod(node);
      await startTryIt(vscode.window.activeTextEditor.document, cache, view, path, method);
    }
  );

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}

async function startTryIt(
  document: vscode.TextDocument,
  cache: Cache,
  view: TryItWebView,
  path: string,
  method: HttpMethod,
  preferredMediaType?: string,
  preferredBodyValue?: unknown
) {
  const bundle = await cache.getDocumentBundle(document);

  if (!bundle || "errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    vscode.window.showErrorMessage("Failed to try it, check OpenAPI file for errors.");
    return view;
  }

  return view.showTryIt(bundle, {
    document,
    versions: getBundleVersions(bundle),
    path,
    method,
    preferredMediaType,
    preferredBodyValue,
  });
}

async function updateTryIt(view: TryItWebView, bundle: Bundle, versions: BundleDocumentVersions) {
  return view.updateTryIt(bundle, versions);
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
