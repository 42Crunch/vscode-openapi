/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Preferences } from "@xliic/common/prefs";
import * as vscode from "vscode";
import { Cache } from "../../../cache";
import { Configuration } from "../../../configuration";
import { EnvStore } from "../../../envstore";
import { ScanReportWebView } from "../../../platform/scan/report-view";
import { PlatformStore } from "../../../platform/stores/platform-store";

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  cache: Cache,
  store: PlatformStore,
  envStore: EnvStore,
  prefs: Record<string, Preferences>
) {
  //const view = new ConfigWebView(context.extensionPath, configuration, secrets, platform, logger);
  const view = new ScanReportWebView(
    `Scan report`,
    context.extensionPath,
    cache,
    configuration,
    secrets,
    store,
    envStore,
    prefs
  );

  vscode.commands.registerCommand("openapi.showConfiguration", async () => {
    await startScan(view);
  });

  vscode.commands.registerCommand("openapi.showSettings", async () => {
    await startScan(view);
  });
}

async function startScan(view: ScanReportWebView) {
  const uri = await vscode.window.showOpenDialog({
    title: "Select Scan Report",
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
  });
  if (uri) {
    view.sendImportScan(uri[0].fsPath);
  }
}
