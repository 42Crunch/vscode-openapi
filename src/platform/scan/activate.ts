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
import { getApiConfig } from "../config";

const selectors = {
  json: { scheme: "file", language: "json" },
  jsonc: { scheme: "file", language: "jsonc" },
  yaml: { scheme: "file", language: "yaml" },
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
  const scanViews: Record<string, ScanWebView> = {};
  const reportViews: Record<string, ScanReportWebView> = {};

  const getScanView = async (uri: vscode.Uri): Promise<ScanWebView> => {
    const viewId = uri.toString();
    const apiConfig = await getApiConfig(uri);

    if (scanViews[viewId] === undefined) {
      scanViews[viewId] = new ScanWebView(
        apiConfig?.alias || "unknown",
        context.extensionPath,
        cache,
        configuration,
        secrets,
        store,
        envStore,
        prefs,
        auditView,
        async () => await getReportView(uri),
        auditContext
      );
    }

    return scanViews[viewId];
  };

  const getReportView = async (uri: vscode.Uri): Promise<ScanReportWebView> => {
    const viewId = uri.toString();
    const apiConfig = await getApiConfig(uri);

    if (reportViews[viewId] === undefined) {
      reportViews[viewId] = new ScanReportWebView(
        apiConfig?.alias ? `Scan report ${apiConfig.alias}` : "Scan report",
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
    }

    return reportViews[viewId];
  };

  const scanCodelensProvider = new ScanCodelensProvider(cache);

  function activateLens(connected: boolean, configuration: Configuration) {
    disposables.forEach((disposable) => disposable.dispose());
    if (isCodeLensEnabled(connected, configuration)) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, scanCodelensProvider)
      );
    } else {
      disposables = [];
    }
  }

  store.onConnectionDidChange(({ connected }) => {
    activateLens(connected, configuration);
    vscode.commands.executeCommand(
      "setContext",
      "openapiScanEnabled",
      isScanEnabled(store.isConnected(), configuration)
    );
  });

  configuration.onDidChange(async (e: vscode.ConfigurationChangeEvent) => {
    if (
      configuration.changed(e, "codeLens") ||
      configuration.changed(e, "platformConformanceScanRuntime")
    ) {
      activateLens(store.isConnected(), configuration);
      vscode.commands.executeCommand(
        "setContext",
        "openapiScanEnabled",
        isScanEnabled(store.isConnected(), configuration)
      );
    }
  });

  commands(cache, platformContext, store, configuration, secrets, getScanView);

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}

function isScanEnabled(isConnected: boolean, configuration: Configuration): boolean {
  return isConnected || configuration.get("platformConformanceScanRuntime") === "cli";
}

function isCodeLensEnabled(isConnected: boolean, configuration: Configuration): boolean {
  return isScanEnabled(isConnected, configuration) && configuration.get("codeLens");
}
