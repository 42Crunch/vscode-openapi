/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../configuration";
import { ConfigWebView } from "./view";
import { PlatformStore } from "../../platform/stores/platform-store";

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  platform: PlatformStore
) {
  const view = new ConfigWebView(context.extensionPath, configuration, secrets, platform);

  vscode.commands.registerCommand("openapi.showConfiguration", async () => {
    await view.show();
    await view.sendColorTheme(vscode.window.activeColorTheme);
    await view.sendLoadConfig();
  });
}
