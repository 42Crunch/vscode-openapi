/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/vault";

import { Configuration } from "../../../configuration";
import { WebView } from "../../web-view";
import { Logger } from "../../../platform/types";
import { loadConfig, saveConfig } from "../../../util/config";

export class VaultWebView extends WebView<Webapp> {
  private vaultUri?: vscode.Uri;

  constructor(
    extensionPath: string,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private logger: Logger
  ) {
    super(extensionPath, "vault", "Vault", vscode.ViewColumn.One, "key-skeleton-left-right");

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    saveVault: async (vault) => {
      const vaultContent = Buffer.from(JSON.stringify(vault, null, 2));
      await vscode.workspace.fs.writeFile(this.vaultUri!, vaultContent);
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);

    const config = await loadConfig(this.configuration, this.secrets);
    if (config.vaultUri.trim() === "") {
      const vaultUri = await this.createVault();
      if (vaultUri) {
        this.vaultUri = vaultUri;
      } else {
        return;
      }
    } else {
      this.vaultUri = vscode.Uri.parse(config.vaultUri);
    }

    const vaultContent = await vscode.workspace.fs.readFile(this.vaultUri);

    await this.sendRequest({
      command: "loadVault",
      payload: JSON.parse(Buffer.from(vaultContent).toString()),
    });
  }

  async showVault() {
    await this.show();
  }

  async createVault() {
    const uri = await vscode.window.showSaveDialog({
      title: "Create new Vault file",
      filters: { "JSON Files": ["json"] },
    });

    if (uri) {
      const emptyVault = {
        schemes: {},
      };
      const config = await loadConfig(this.configuration, this.secrets);
      const vaultContent = Buffer.from(JSON.stringify(emptyVault, null, 2));
      await vscode.workspace.fs.writeFile(uri, vaultContent);
      this.logger.info(`Vault created at ${uri.toString()}`);
      config.vaultUri = uri.toString();
      await saveConfig(config, this.configuration, this.secrets);
      return uri;
    }
  }
}
