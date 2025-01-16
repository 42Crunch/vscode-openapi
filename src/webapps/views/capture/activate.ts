/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../../configuration";
import { CaptureWebView } from "./view";
import { PlatformStore } from "../../../platform/stores/platform-store";
import { Logger } from "../../../platform/types";

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  platform: PlatformStore,
  logger: Logger
) {
  const view = new CaptureWebView(context.extensionPath, configuration);

  vscode.commands.registerCommand("openapi.showCapture", async () => {
    await view.showCaptureWebView();
  });
}
