import * as vscode from "vscode";
import { Preferences } from "@xliic/common/prefs";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { PlatformContext } from "../types";

import { ScanCodelensProvider } from "./lens";
import commands from "./commands";
import { ScanWebView } from "./view";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { AuditWebView } from "../../audit/view";

const selectors = {
  json: { language: "json" },
  jsonc: { language: "jsonc" },
  yaml: { language: "yaml" },
};

export function activate(
  context: vscode.ExtensionContext,
  platformContext: PlatformContext,
  cache: Cache,
  configuration: Configuration,
  store: PlatformStore,
  envStore: EnvStore,
  prefs: Record<string, Preferences>,
  auditView: AuditWebView
): vscode.Disposable {
  let disposables: vscode.Disposable[] = [];
  const view = new ScanWebView(context.extensionPath, cache, configuration, store, envStore, prefs);

  const scanCodelensProvider = new ScanCodelensProvider(cache);

  store.onConnectionDidChange(({ connected }) => {
    disposables.forEach((disposable) => disposable.dispose());
    if (connected) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, scanCodelensProvider)
      );
    } else {
      disposables = [];
    }
  });

  commands(cache, platformContext, store, view, auditView);

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
