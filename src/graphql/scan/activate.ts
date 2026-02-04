import * as vscode from "vscode";
import { Preferences } from "@xliic/common/prefs";
import { Cache } from "../../cache";
import { PlatformStore } from "../../platform/stores/platform-store";

import { ScanGqlCodelensProvider } from "../scan/lens";
import commands from "./commands";
// import { ScanWebView } from "./view";
// import { ScanReportWebView } from "./report-view";
import { Configuration } from "../../configuration";
import { EnvStore } from "../../envstore";
import { AuditWebView } from "../../audit/view";
import { AuditContext } from "../../types";
// import { getOpenapiAlias } from "./config";
import { SignUpWebView } from "../../webapps/signup/view";
import { Logger, PlatformContext } from "../../platform/types";
import { ScanWebView } from "../../platform/scan/view";
import { ScanReportWebView } from "../../platform/scan/report-view";
import { getOpenapiAlias } from "../../platform/scan/config";
import { ScanGqlWebView } from "./view";

const selectors = {
  graphql: { scheme: "file", language: "graphql" },
  gql: { scheme: "file", language: "gql" },
  graphqls: { scheme: "file", language: "graphqls" },
  sdl: { scheme: "file", language: "sdl" },
  gqls: { scheme: "file", language: "gqls" },
};

//const selectors = { pattern: "*.{graphql,gql,graphqls,sdl,gqls}" };

export function activate(
  context: vscode.ExtensionContext,
  platformContext: PlatformContext,
  cache: Cache,
  logger: Logger,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  envStore: EnvStore,
  prefs: Record<string, Preferences>,
  signUpWebView: SignUpWebView,
  auditView: AuditWebView,
  auditContext: AuditContext,
): vscode.Disposable {
  let disposables: vscode.Disposable[] = [];
  const scanViews: Record<string, ScanGqlWebView> = {};
  const reportViews: Record<string, ScanReportWebView> = {}; // todo: later

  const getScanView = async (uri: vscode.Uri): Promise<ScanGqlWebView> => {
    const viewId = uri.toString();
    const alias = (await getOpenapiAlias(uri)) || "unknown";

    if (scanViews[viewId] === undefined) {
      scanViews[viewId] = new ScanGqlWebView(
        alias,
        context.extensionPath,
        cache,
        logger,
        configuration,
        context.workspaceState,
        secrets,
        store,
        envStore,
        prefs,
        auditView,
        () => getReportView(uri),
        auditContext,
      );
    }

    return scanViews[viewId];
  };

  const getReportView = async (uri: vscode.Uri): Promise<ScanReportWebView> => {
    const viewId = uri.toString();
    const alias = (await getOpenapiAlias(uri)) || "unknown";

    if (reportViews[viewId] === undefined) {
      reportViews[viewId] = new ScanReportWebView(alias, context.extensionPath, cache);
    }

    return reportViews[viewId];
  };

  const getExistingReportView = (uri: vscode.Uri): ScanReportWebView => {
    const viewId = uri.toString();
    return reportViews[viewId];
  };

  const scanCodelensProvider = new ScanGqlCodelensProvider(cache);

  function activateLens(enabled: boolean) {
    disposables.forEach((disposable) => disposable.dispose());
    if (enabled) {
      disposables = Object.values(selectors).map((selector) =>
        vscode.languages.registerCodeLensProvider(selector, scanCodelensProvider),
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

  commands(
    context,
    cache,
    platformContext,
    store,
    configuration,
    secrets,
    logger,
    getScanView,
    null, //getExistingReportView,
    signUpWebView,
  );

  return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
