/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../../configuration";
import { ConfigWebView } from "./view";
import { PlatformStore } from "../../../platform/stores/platform-store";
import { Logger } from "../../../platform/types";
import { BigFilesWebView } from "../bigfiles/view";
import { ScanReportWebView } from "../../../platform/scan/report-view";

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  platform: PlatformStore,
  logger: Logger
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
    await startScan();
  });

  vscode.commands.registerCommand("openapi.showSettings", async () => {
    await startScan();
  });
}

async function startScan() {
  const uri = await vscode.window.showOpenDialog({
    title: "Select Scan Report",
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
  });
  if (uri) {
    const file = payload.file;
    const report = await readFile(file, { encoding: "utf8" });
    const n = 10;
    let offset = 0;
    let chunkSize = Math.ceil(report.length / n);
    for (let i = 1; i <= n; i++) {
      if (report.length - offset < chunkSize) {
        chunkSize = report.length - offset;
      }
      const textSegment = report.substr(offset, chunkSize);
      offset += chunkSize;
      this.sendRequest({
        command: "sendFileSegment",
        payload: { file, textSegment, progress: i / n },
      });
    }
  }
}
