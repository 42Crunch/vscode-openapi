/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../configuration";
import { ConfigWebView } from "./view";
import { PlatformStore } from "../../platform/stores/platform-store";
import { Logger } from "../../platform/types";

var view : ConfigWebView | undefined = undefined;

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  platform: PlatformStore,
  logger: Logger
) {
  view = new ConfigWebView(context.extensionPath, configuration, secrets, platform, logger);

  vscode.commands.registerCommand("openapi.showConfiguration", async () => {
    await view?.show();
    await view?.sendColorTheme(vscode.window.activeColorTheme);
    await view?.sendLoadConfig();
  });

  vscode.commands.registerCommand("openapi.showSettings", async () => {
    await view?.show();
    await view?.sendColorTheme(vscode.window.activeColorTheme);
    await view?.sendLoadConfig();
  });
}

export async function reloadConfig() {
  await view?.sendLoadConfig();
}
