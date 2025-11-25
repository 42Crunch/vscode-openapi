/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../../configuration";
import { VaultWebView } from "./view";
import { Logger } from "../../../platform/types";

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  logger: Logger
) {
  const view = new VaultWebView(context.extensionPath, configuration, secrets, logger);

  vscode.commands.registerCommand("openapi.showVault", async () => {
    await view.showVault();
  });

  vscode.commands.registerCommand("openapi.createVault", async () => {
    if (view.isActive()) {
      vscode.window.showErrorMessage(
        "Please close the existing Vault view before creating a new one.",
        { modal: true }
      );
      return;
    }
    await view.createVault();
    await view.showVault();
  });
}
