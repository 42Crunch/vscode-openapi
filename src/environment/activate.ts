/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { EnvironmentWebView } from "./view";
import { EnvStore } from "../envstore";

export function activate(context: vscode.ExtensionContext, envStore: EnvStore) {
  const view = new EnvironmentWebView(context.extensionPath, envStore);

  vscode.commands.registerCommand("openapi.showEnvironment", async () => {
    await view.showEnvironment();
  });
}
