/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Agent } from "undici";

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

      const result = await http2Ping(`https://${services}`, this.logger);

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

      const result = await this.platform.testConnection(credentials, this.logger);

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

    sendHttpRequest: ({ id, request, config }) =>
      executeHttpRequest(id, request, config, this.logger),

    selectVaultFile: async () => {
      const uris = await vscode.window.showOpenDialog({
        title: "Select Vault File",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          Vault: ["json"],
        },
      });

      if (uris === undefined || uris.length === 0) {
        return;
      }

      this.config = await loadConfig(this.configuration, this.secrets);
      this.config.vaultUri = uris[0].toString();
      await saveConfig(this.config, this.configuration, this.secrets);

      return {
        command: "loadConfig",
        payload: this.config,
      };
    },
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

async function http2Ping(url: string, logger: Logger): Promise<ConnectionTestResult> {
  const timeout = 5000;
  let hasTimedOut = false;

  logger.info(`Starting connection test to ${url} with timeout of ${timeout}ms`);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    hasTimedOut = true;
    logger.error(`Connection test timed out after ${timeout}ms`);
    controller.abort();
  }, timeout);

  try {
    const agent = new Agent({ allowH2: true });

    const response = await fetch(url, {
      dispatcher: agent as any,
      method: "GET",
      signal: controller.signal,
    });

    logger.info(`Received response from ${url}, status code: ${response.status}`);
    logger.debug(`Response headers: ${JSON.stringify(response.headers)}`);

    if (response.status === 415) {
      logger.info("Connection test succeeded");
      return { success: true };
    } else {
      logger.error(`Connection test failed with unexpected status code: ${response.status}`);
      return { success: false, message: `Unexpected response status: ${response.status}` };
    }
  } catch (error: any) {
    logger.error(`Failed to connect to ${url}: ${error.message}`);
    clearTimeout(timer);
    if (error.name === "AbortError" && hasTimedOut) {
      return {
        success: false,
        message: `Timed out waiting to connect after ${timeout}ms`,
      };
    } else {
      return {
        success: false,
        message: `Failed to connect to ${url}: ${formatError(error)}`,
      };
    }
  }
}

function formatError(error: any, depth: number = 0): string {
  if (depth > 5 || !error) return "Unknown error";
  if (typeof error === "string") return error;

  let message = error.message || error.name || String(error);

  // Handle aggregate errors
  if (error.errors?.length > 0) {
    const nested = error.errors.map((e: any) => formatError(e, depth + 1)).join("; ");
    message = message ? `${message}: ${nested}` : nested;
  }

  // Handle error cause
  if (error.cause) {
    const cause = formatError(error.cause, depth + 1);
    if (cause) message += ` (caused by: ${cause})`;
  }

  return message || "Unknown error";
}
