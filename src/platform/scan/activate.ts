import * as vscode from "vscode";
import { Preferences } from "@xliic/common/prefs";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { PlatformContext } from "../types";

import { ScanCodelensProvider } from "./lens";
import commands from "./commands";
import { ScanWebView } from "./view";
import { ScanReportWebView } from "./report-view";
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

  const reportView = new ScanReportWebView(
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

  function activateLens(connected: boolean, enabled: boolean) {
    disposables.forEach((disposable) => disposable.dispose());
    if (connected && enabled) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, scanCodelensProvider)
      );
    } else {
      disposables = [];
    }
  }

  store.onConnectionDidChange(({ connected }) => {
    activateLens(connected, configuration.get("codeLens"));
  });

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (configuration.changed(e, "codeLens")) {
      activateLens(store.isConnected(), configuration.get("codeLens"));
    }
  });

  commands(cache, platformContext, store, view, reportView);

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
