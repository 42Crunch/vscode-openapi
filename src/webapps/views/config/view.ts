/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as http2 from "http2";

import { Webapp } from "@xliic/common/webapp/config";
import {
  CliDownloadProgress,
  Config,
  ConnectionTestResult,
  ShowCliDownloadMessage,
} from "@xliic/common/config";
import { Configuration } from "../../../configuration";
import { WebView } from "../../web-view";
import { PlatformStore } from "../../../platform/stores/platform-store";
import * as scandManagerApi from "../../../platform/api-scand-manager";
import { Logger } from "../../../platform/types";
import { loadConfig, saveConfig } from "../../../util/config";
import { checkForCliUpdate, downloadCli, testCli } from "../../../platform/cli-ast";
import { transformValues } from "./utils-gen";
import { getCliUpdate } from "../../../platform/cli-ast-update";
import { executeHttpRequest } from "../../http-handler";

export class ConfigWebView extends WebView<Webapp> {
  private config?: Config;
  constructor(
    extensionPath: string,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private platform: PlatformStore,
    private logger: Logger
  ) {
    super(extensionPath, "config", "Settings", vscode.ViewColumn.One);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    saveConfig: async (config) => {
      await saveConfig(config, this.configuration, this.secrets);
      this.config = await loadConfig(this.configuration, this.secrets);
      return {
        command: "loadConfig",
        payload: this.config,
      };
    },

    testOverlordConnection: async () => {
      const services =
        this.config?.platformServices.source === "auto"
          ? this.config?.platformServices.auto
          : this.config?.platformServices.manual;

      if (services === undefined || services === "") {
        return {
          command: "showOverlordConnectionTest",
          payload: { success: false, message: "Services host is not configured" },
        };
      }

      const result = await http2Ping(`https://${services}`);

      return {
        command: "showOverlordConnectionTest",
        payload: result,
      };
    },

    testPlatformConnection: async () => {
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

    testScandManagerConnection: async () => {
      const scandManager = this.config?.scandManager;
      if (scandManager === undefined || scandManager.url === "") {
        return {
          command: "showScandManagerConnectionTest",
          payload: { success: false, message: "no scand manager confguration" },
        };
      }

      const result = await scandManagerApi.testConnection(scandManager, this.logger);

      return {
        command: "showScandManagerConnectionTest",
        payload: result,
      };
    },

    testCli: async () => {
      const result = await testCli(this.config!.cliDirectoryOverride);

      // if the binary was found, check for updates
      // otherwise the download button will be shown in the web UI
      if (result.success) {
        checkForCliUpdate(this.config!.repository, this.config!.cliDirectoryOverride);
      }

      return {
        command: "showCliTest",
        payload: result,
      };
    },

    downloadCli: () =>
      downloadCliHandler(this.config!.repository, this.config!.cliDirectoryOverride),

    openLink: async (url: string) => {
      // @ts-ignore
      // workaround for vscode https://github.com/microsoft/vscode/issues/85930
      vscode.env.openExternal(url);
    },

    sendHttpRequest: ({ id, request, config }) => executeHttpRequest(id, request, config),
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    this.config = await loadConfig(this.configuration, this.secrets);
    if (this.platform.isConnected()) {
      try {
        // this could throw if the token has become invalid since the start
        const convention = await this.platform.getCollectionNamingConvention();
        if (convention.pattern !== "") {
          this.config.platformCollectionNamingConvention = convention;
        }
      } catch (ex) {
        // can't get naming convention if the token is invalid
      }
    }
    await this.sendRequest({
      command: "loadConfig",
      payload: this.config,
    });
  }

  async showConfig() {
    await this.show();
  }
}

async function* downloadCliHandler(
  repository: string,
  cliDirectoryOverride: string
): AsyncGenerator<ShowCliDownloadMessage, void, unknown> {
  try {
    if (repository === undefined || repository === "") {
      throw new Error("Repository URL is not set");
    }

    const manifest = await getCliUpdate(repository, "0.0.0");

    if (manifest === undefined) {
      throw new Error(
        "Failed to download 42Crunch API Security Testing Binary, manifest not found"
      );
    }

    const location = yield* transformValues(
      downloadCli(manifest, cliDirectoryOverride),
      (progress: CliDownloadProgress): ShowCliDownloadMessage => ({
        command: "showCliDownload",
        payload: { completed: false, progress },
      })
    );

    yield {
      command: "showCliDownload",
      payload: {
        completed: true,
        success: true,
        location,
      },
    };
  } catch (ex) {
    yield {
      command: "showCliDownload",
      payload: {
        completed: true,
        success: false,
        error: `Failed to download: ${ex}`,
      },
    };
  }
}

function http2Ping(url: string): Promise<ConnectionTestResult> {
  const timeout = 5000;

  return new Promise((resolve, reject) => {
    try {
      const client = http2.connect(url);
      client.setTimeout(timeout);

      client.on("error", (err) => {
        client.close();
        resolve({
          success: false,
          message: err.message,
        });
      });

      client.on("timeout", (err) => {
        client.close();
        resolve({
          success: false,
          message: `Timed out wating to connect after ${timeout}ms`,
        });
      });

      client.on("connect", () => {
        client.close();
        resolve({
          success: true,
        });
      });
    } catch (ex) {
      resolve({
        success: false,
        message: `Failed to create connection: ${ex}`,
      });
    }
  });
}
