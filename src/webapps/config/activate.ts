/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../configuration";
import { ConfigWebView } from "./view";

export function activate(context: vscode.ExtensionContext, configuration: Configuration) {
  const view = new ConfigWebView(context.extensionPath);

  vscode.commands.registerCommand("openapi.showConfiguration", async () => {
    await view.show();
    await view.sendColorTheme(vscode.window.activeColorTheme);
    //await view.sendLoadEnvironment();
  });
}
