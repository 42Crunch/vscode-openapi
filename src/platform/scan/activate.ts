import * as vscode from "vscode";
import { Preferences } from "@xliic/common/prefs";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { Logger, PlatformContext } from "../types";

import { ScanCodelensProvider } from "./lens";
import commands from "./commands";
import { ScanWebView } from "./view";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { AuditWebView } from "../../audit/view";
import { AuditContext } from "../../types";

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
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  envStore: EnvStore,
  prefs: Record<string, Preferences>,
  auditView: AuditWebView,
  auditContext: AuditContext
): vscode.Disposable {
  let disposables: vscode.Disposable[] = [];
  const view = new ScanWebView(
    context.extensionPath,
    cache,
    configuration,
    secrets,
    store,
    envStore,
    prefs,
    auditView,
    auditContext
  );

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

  commands(cache, platformContext, store, view);

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
