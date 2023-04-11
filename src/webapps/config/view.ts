/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/config";
import { Config } from "@xliic/common/config";
import { Configuration } from "../../configuration";
import { WebView } from "../../web-view";
import { PlatformStore } from "../../platform/stores/platform-store";
import { getPlatformCredentials } from "../../credentials";

export class ConfigWebView extends WebView<Webapp> {
  private config?: Config;
  constructor(
    extensionPath: string,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private platform: PlatformStore
  ) {
    super(extensionPath, "config", "Settings", vscode.ViewColumn.One, false);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    saveConfig: async (config: Config) => {
      this.config = config;
      // vscode.workspace
      //   .getConfiguration("openapi")
      //   .update("tryit.insecureSslHostnames", config.insecureSslHostnames);
    },

    testPlatformConnection: async () => {
      //const c = await getPlatformCredentials(this.configuration, this.secrets);
      if (this.config === undefined) {
        return {
          command: "showPlatformConnectionTest",
          payload: { success: false, message: "no credentials" },
        };
      }

      const credentials = {
        platformUrl: this.config.platformUrl,
        apiToken: this.config.platformApiToken,
        services: "",
      };

      const result = await this.platform.testConnection(credentials);

      return { command: "showPlatformConnectionTest", payload: result };
    },
  };

  async sendLoadConfig() {
    const platformUrl = this.configuration.get<string>("platformUrl")!;
    const insecureSslHostnames = this.configuration.get<string[]>("tryit.insecureSslHostnames")!;

    this.sendRequest({
      command: "loadConfig",
      payload: { platformUrl, platformApiToken: "", insecureSslHostnames },
    });
  }
}
