/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/capture";
import { CaptureItem, CaptureSettings, PrepareOptions, Status } from "@xliic/common/capture";
import { GeneralError } from "@xliic/common/error";

import { loadConfig } from "../../../util/config";
import { WebView } from "../../web-view";
import { Configuration } from "../../../configuration";
import { executeHttpRequest } from "../../http-handler";
import { offerUpgrade } from "../../../platform/upgrade";
import { Logger } from "../../../platform/types";
import {
  CaptureConnection,
  getCaptureConnection,
  requestDelete,
  requestDownload,
  requestPrepare,
  requestStart,
  requestStatus,
  requestUpload,
} from "./api";
import { delay } from "../../../time-util";

const pollingDelayMs = 5 * 1000; // 5s
const pollingTimeMs = 5 * 60 * 1000; // 5min
const pollingLimit = Math.floor(pollingTimeMs / pollingDelayMs);

const startPollingDelayMs = 100; // 0.1s
const startPollingTimeMs = 30 * 1000; // 30s
const startPollingLimit = Math.floor(startPollingTimeMs / startPollingDelayMs);

export class CaptureWebView extends WebView<Webapp> {
  private items: CaptureItem[];
  private useDevEndpoints: boolean;
  private captureConnections: Map<string, CaptureConnection>;

  constructor(
    extensionPath: string,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private logger: Logger
  ) {
    super(extensionPath, "capture", "API Contract Generator", vscode.ViewColumn.One);
    this.items = [];
    this.useDevEndpoints = configuration.get<boolean>("internalUseDevEndpoints");
    this.captureConnections = new Map<string, CaptureConnection>();

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    selectFiles: async (payload: { id: string | undefined }) => {
      const uris = await vscode.window.showOpenDialog({
        title: "Select HAR/Postman files",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true,
      });
      if (uris === undefined || uris.length === 0) {
        return;
      }

      const files: string[] = uris.map((uri) => uri.toString());

      if (payload.id) {
        // update existing item
        const item = this.items.find((item) => item.id === payload.id)!;
        item.files = [...new Set(item.files.concat(files))];
        this.sendRequest({
          command: "saveCapture",
          payload: item,
        });
      } else {
        const item = this.getNewItem(files);
        this.items.unshift(item);
        this.sendRequest({
          command: "saveCapture",
          payload: item,
        });
      }
    },

    convert: async (payload: { id: string }) => {
      const item = this.items.find((item) => item.id === payload.id)!;
      item.log = ["Started new session"];
      item.downloadedFile = undefined;

      let captureConnection: CaptureConnection;

      try {
        captureConnection = await this.getCaptureConnection(undefined);
      } catch (error) {
        this.showExecutionStatusResponse(item, "failed", false, (error as Error).message);
        return;
      }

      // Handle the case when restart requested
      if (item.quickgenId && item.status === "failed") {
        try {
          await requestDelete(captureConnection, item.quickgenId, this.logger);
        } catch (error) {
          // Silent removal
        }
      }

      item.status = "running";

      // Prepare request -> capture server
      let quickgenId = undefined;
      try {
        quickgenId = await requestPrepare(captureConnection, item.prepareOptions, this.logger);
        this.captureConnections.set(quickgenId, captureConnection);
        this.showPrepareResponse(item, quickgenId, true, "");
      } catch (error) {
        this.showPrepareResponse(item, quickgenId, false, getError(error));
        await this.maybeOfferUpgrade(error);
        return;
      }

      // Upload request -> capture server
      try {
        await requestUpload(
          captureConnection,
          quickgenId,
          item.files,
          (percent: number) => {
            if (item.status !== "failed") {
              this.showPrepareUploadFileResponse(item, true, "", percent === 1.0, percent);
            }
          },
          this.logger
        );
      } catch (error) {
        this.showPrepareUploadFileResponse(item, false, getError(error), false, 0.0);
        await this.maybeOfferUpgrade(error);
        return;
      }

      const captureStarted: Promise<"success" | "error"> = new Promise(async (resolve) => {
        const startCapture = async () => {
          if (item.startPollingCounter > startPollingLimit) {
            this.showExecutionStartResponse(item, false, "Polling limit exceeded");
            resolve("error");
            return;
          }

          try {
            item.startPollingCounter += 1;
            await requestStart(captureConnection, quickgenId, this.logger);
            this.showExecutionStartResponse(item, true, "");
            resolve("success");
            return;
          } catch (error: any) {
            if (error?.response?.statusCode === 409) {
              setTimeout(async () => {
                startCapture();
              }, startPollingDelayMs);
            } else {
              this.showExecutionStartResponse(item, false, getError(error));
              await this.maybeOfferUpgrade(error);
              resolve("error");
            }
            return;
          }
        };
        startCapture();
      });

      const refreshJobStatus = async (quickgenId: string) => {
        await delay(pollingDelayMs);
        try {
          const status = await requestStatus(captureConnection, quickgenId, this.logger);
          item.pollingCounter += 1;
          this.showExecutionStatusResponse(item, status, true, "");
          const keepPolling = item.pollingCounter <= pollingLimit;
          if ((status === "pending" || status === "running") && keepPolling) {
            setTimeout(async () => {
              refreshJobStatus(quickgenId);
            }, pollingDelayMs);
          }
        } catch (error) {
          this.showExecutionStatusResponse(item, "finished", false, getError(error));
          await this.maybeOfferUpgrade(error);
          return;
        }
      };

      const startResult = await captureStarted;

      if (startResult === "success") {
        refreshJobStatus(quickgenId);
      }
    },

    saveCaptureSettings: async (payload: { id: string; settings: CaptureSettings }) => {
      const { id, settings } = payload;
      const item = this.items.find((item) => item.id === id);
      if (item) {
        item.prepareOptions = settings.prepareOptions;
        item.files = settings.files;
      }
    },

    downloadFile: async (payload: { id: string }) => {
      const uri = await vscode.window.showSaveDialog({
        title: "Save OpenAPI file",
        filters: {
          OpenAPI: ["json"],
        },
      });

      if (uri) {
        const item = this.items.find((item) => item.id === payload.id)!;
        const captureConnection = await this.getCaptureConnection(item.quickgenId);

        try {
          const fileText = await requestDownload(captureConnection, item.quickgenId!, this.logger);
          const encoder = new TextEncoder();
          await vscode.workspace.fs.writeFile(
            uri,
            encoder.encode(JSON.stringify(fileText, null, 2))
          );
          this.showDownloadResult(item, uri.toString(), true, "");
        } catch (error) {
          this.showDownloadResult(item, uri.toString(), false, getError(error));
        }
      }
    },

    deleteJob: async (payload: { id: string }) => {
      const item = this.items.find((item) => item.id === payload.id)!;
      this.items = this.items.filter((item) => item.id !== payload.id);
      // If prepare fails, there will be no quickgenId defined
      if (item?.quickgenId) {
        try {
          const captureConnection = await this.getCaptureConnection(item.quickgenId);
          await requestDelete(captureConnection, item.quickgenId, this.logger);
          this.captureConnections.delete(item.quickgenId);
        } catch (error) {
          // Silent removal
        }
      }
    },

    openLink: async (payload: string) => {
      const url = vscode.Uri.parse(payload);
      if (url.scheme === "file") {
        const document = await vscode.workspace.openTextDocument(url);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
      } else {
        vscode.env.openExternal(url);
      }
    },

    sendHttpRequest: ({ id, request, config }) =>
      executeHttpRequest(id, request, config, this.logger),
  };

  async getCaptureConnection(quickgenId: string | undefined): Promise<CaptureConnection> {
    if (quickgenId !== undefined) {
      return this.captureConnections.get(quickgenId)!;
    } else {
      const connection = await getCaptureConnection(
        this.configuration,
        this.secrets,
        this.useDevEndpoints,
        this.logger
      );

      if (!connection) {
        throw new Error("Failed to get capture connection");
      }

      return connection;
    }
  }

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    await this.sendLoadConfig();
    await this.sendRequest({
      command: "showCaptureWindow",
      payload: { items: this.items },
    });
    try {
      const captureConnection = await this.getCaptureConnection(undefined);
      await this.sendRequest({
        command: "setCaptureToken",
        payload: captureConnection.token,
      });
    } catch (error) {
      this.showGeneralError({
        message: "Failed to establish connection to capture server, please check your credentials.",
        details: (error as Error).message,
      });
    }
  }

  async showCaptureWebView() {
    await this.show();
  }

  async maybeOfferUpgrade(error: any) {
    if (error?.response?.statusCode === 402) {
      const config = await loadConfig(this.configuration, this.secrets);
      if (config.platformAuthType === "anond-token") {
        await offerUpgrade();
      }
    }
  }

  getNewItem(files: string[]): CaptureItem {
    return {
      id: crypto.randomUUID(),
      files: files,
      quickgenId: undefined,
      prepareOptions: {
        basePath: "/",
        servers: ["https://server.example.com"],
      },
      status: "pending",
      pollingCounter: 0,
      startPollingCounter: 0,
      log: ["Started new session"],
      downloadedFile: undefined,
    };
  }

  setPrepareOptions(itemOptions: PrepareOptions, options: PrepareOptions): void {
    itemOptions.basePath = options.basePath;
    itemOptions.servers = options.servers.map((e) => e.trim()).filter((e) => e.length > 0);
  }

  showPrepareResponse(item: CaptureItem, quickgenId: string, success: boolean, error: string) {
    if (success) {
      item.quickgenId = quickgenId;
      item.status = "running";
      item.log.push("Created quickgen job");
    } else {
      item.status = "failed";
      item.log.push("Failed to prepare quickgen job: " + error);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showPrepareUploadFileResponse(
    item: CaptureItem,
    success: boolean,
    error: string,
    completed: boolean,
    percent: number
  ) {
    if (success) {
      const log = item.log;
      if (completed) {
        if (log[log.length - 1].startsWith("Uploading files")) {
          log[log.length - 1] = `Uploading files: 100%`;
        }
        item.log.push("All files successfully uploaded");
      } else {
        percent = Math.ceil(100 * percent);
        if (log[log.length - 1].startsWith("Uploading files")) {
          log[log.length - 1] = `Uploading files: ${percent}%`;
        } else {
          log.push(`Uploading files: ${percent}%`);
        }
      }
    } else {
      item.status = "failed";
      item.log.push("Failed to upload files: " + error);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showExecutionStartResponse(item: CaptureItem, success: boolean, message: string) {
    if (success) {
      item.log.push("Quickgen job started");
    } else {
      item.status = "failed";
      item.log.push("Quickgen job failed to start: " + message);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showExecutionStatusResponse(item: CaptureItem, status: Status, success: boolean, error: string) {
    if (success) {
      const log = item.log;
      if (log[log.length - 1].startsWith("Quickgen job ")) {
        log[log.length - 1] = `Quickgen job ${status}`;
      } else {
        log.push(`Quickgen job ${status}`);
      }
      if (status === "finished") {
        item.status = "finished";
      } else if (status === "failed") {
        item.status = "failed";
      }
    } else {
      item.status = "failed";
      item.log.push("Quickgen job execution failed: " + error);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showDownloadResult(item: CaptureItem, downloadedFile: string, success: boolean, error: string) {
    if (success) {
      item.downloadedFile = downloadedFile;
    } else {
      item.log.push("Download failed: " + error);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  async showGeneralError(error: GeneralError) {
    this.sendRequest({
      command: "showGeneralError",
      payload: error,
    });
  }

  async sendLoadConfig() {
    const config = await loadConfig(this.configuration, this.secrets);
    this.sendRequest({
      command: "loadConfig",
      payload: config,
    });
  }
}

function getError(error: any): string {
  if (error?.response?.body?.detail) {
    return `${error}, ${error.response.body.detail}`;
  }
  return `${error}`;
}
