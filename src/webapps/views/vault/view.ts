/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/vault";

import { Configuration } from "../../../configuration";
import { WebView } from "../../web-view";
import { Logger } from "../../../platform/types";

export class VaultWebView extends WebView<Webapp> {
  constructor(extensionPath: string, private configuration: Configuration, private logger: Logger) {
    super(extensionPath, "vault", "Vault", vscode.ViewColumn.One, "key-skeleton");

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    saveVault: async (vault) => {
      const vaultUri = vscode.Uri.parse("file:///Users/anton/crunch/vault/vault.json");
      const vaultContent = Buffer.from(JSON.stringify(vault, null, 2));
      await vscode.workspace.fs.writeFile(vaultUri, vaultContent);
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    const vaultUri = vscode.Uri.parse("file:///Users/anton/crunch/vault/vault.json");
    const vaultContent = await vscode.workspace.fs.readFile(vaultUri);

    await this.sendRequest({
      command: "loadVault",
      payload: JSON.parse(Buffer.from(vaultContent).toString()),
    });
  }

  async showVault() {
    await this.show();
  }
}
