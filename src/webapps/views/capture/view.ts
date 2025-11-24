/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";
import * as fs from "fs";

import { Webapp } from "@xliic/common/webapp/capture";
import { GeneralError } from "@xliic/common/error";
import { Result } from "@xliic/result";
import { CaptureItem, CaptureSettings, PrepareOptions, Status } from "@xliic/common/capture";

import { loadConfig } from "../../../util/config";
import { WebView } from "../../web-view";
import { Configuration } from "../../../configuration";
import { executeHttpRequest } from "../../http-handler";
import { offerUpgrade } from "../../../platform/upgrade";
import { Logger } from "../../../platform/types";
import { retry } from "../../../time-util";
import {
  CaptureConnection,
  getCaptureConnection,
  requestDelete,
  requestDownload,
  requestPrepare,
  requestStart,
  requestStatus,
  requestSummary,
  requestUpload,
} from "./api";
import { basename } from "../../../fs-util";

export class CaptureWebView extends WebView<Webapp> {
  private items: CaptureItem[];
  private captureConnections: Map<string, CaptureConnection>;

  constructor(
    extensionPath: string,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private logger: Logger
  ) {
    super(extensionPath, "capture", "API Contract Generator", vscode.ViewColumn.One);
    this.items = [];
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
      item.downloadedFile = undefined;
      item.uploadStatus = {};
      item.log = [];

      const files = await sortFiles(item.files);

      if (files.env.length > 1) {
        this.updateItem(
          item,
          "failed",
          "Multiple environment files provided. Please provide only one environment file."
        );
        return;
      }

      if (files.postman.length === 0 && files.other.length === 0) {
        this.updateItem(
          item,
          "failed",
          "No valid Postman or HAR files provided. Please provide at least one Postman or HAR file."
        );
        return;
      }

      const [captureConnection, captureConnectionError] = await this.getCaptureConnection(
        undefined
      );

      if (captureConnectionError !== undefined) {
        this.updateItem(
          item,
          "failed",
          `Failed to establish connection to capture server: ${getError(captureConnectionError)}`
        );
        return;
      }

      // Handle the case when restart requested
      if (item.quickgenId && item.status === "failed") {
        await requestDelete(captureConnection, item.quickgenId, this.logger);
      }

      this.updateItem(item, "running", "Started new session");

      const [quickgenId, prepareError] = await requestPrepare(
        captureConnection,
        item.prepareOptions,
        this.logger
      );

      if (prepareError !== undefined) {
        await this.updateItem(
          item,
          "failed",
          `Failed to prepare quickgen job: ${getError(prepareError)}`
        );
        await this.maybeOfferUpgrade(prepareError);
        return;
      }

      item.quickgenId = quickgenId;
      this.captureConnections.set(quickgenId, captureConnection);
      await this.updateItem(item, undefined, "Created quickgen job");
      await this.updateItem(item, undefined, "Starting file uploads");

      for (const postman of files.postman) {
        const [_, error] = await this.uploadFile(
          captureConnection,
          item,
          quickgenId,
          postman,
          files.env[0]
        );
        if (error !== undefined) {
          this.updateItem(item, "failed", `Upload failed for file ${postman}: ${getError(error)}`);
          await this.maybeOfferUpgrade(error);
          return;
        }
      }

      for (const other of files.other) {
        const [_, error] = await this.uploadFile(
          captureConnection,
          item,
          quickgenId,
          other,
          undefined
        );
        if (error !== undefined) {
          this.updateItem(item, "failed", `Upload failed for file ${other}: ${getError(error)}`);
          await this.maybeOfferUpgrade(error);
          return;
        }
      }

      this.updateItem(item, undefined, "All files uploaded, starting conversion");

      const start = async (): Promise<Result<"done" | "retry", unknown>> => {
        const [_, error] = await requestStart(captureConnection, quickgenId, this.logger);
        if (error !== undefined) {
          if ((error as any)?.response?.statusCode === 409) {
            return ["retry", undefined];
          } else {
            return [undefined, error];
          }
        }
        return ["done", undefined];
      };

      // start capture
      const [started, startError] = await retry(start, {
        maxRetries: 30,
        delay: 500,
        maxDelay: 5000,
      });

      if (startError !== undefined) {
        await this.updateItem(
          item,
          "failed",
          `Failed to start conversion: ${getError(startError)}`
        );
        const uploadSummary = await this.getUploadSummary(captureConnection, quickgenId, item);
        await this.updateItem(item, undefined, uploadSummary);
        await this.updateItem(item, "failed", `Conversion failed`);
        await this.maybeOfferUpgrade(startError);
        return;
      }

      if (started !== "done") {
        this.updateItem(item, "failed", `Conversion failed: exceeded maximum retries`);
        return;
      }

      this.updateItem(item, undefined, "Conversion started, waiting for completion");

      const monitor = async (): Promise<Result<"done" | "retry", unknown>> => {
        const [status, statusError] = await requestStatus(
          captureConnection,
          quickgenId,
          this.logger
        );
        if (statusError !== undefined) {
          return [undefined, statusError];
        }

        if (status === "pending" || status === "running") {
          return ["retry", undefined];
        }

        return ["done", undefined];
      };

      // monitor status
      const [status, convertError] = await retry(monitor, {
        maxRetries: 60,
        delay: 2000,
        maxDelay: 5000,
      });

      if (convertError !== undefined) {
        const uploadSummary = await this.getUploadSummary(captureConnection, quickgenId, item);
        await this.updateItem(item, undefined, uploadSummary);
        await this.updateItem(item, "failed", `Conversion failed: ${getError(convertError)}`);
        await this.maybeOfferUpgrade(convertError);
        return;
      }

      const uploadSummary = await this.getUploadSummary(captureConnection, quickgenId, item);
      await this.updateItem(item, undefined, uploadSummary);

      if (status === "done") {
        await this.updateItem(item, "finished", `Conversion completed`);
      } else {
        await this.updateItem(item, "failed", `Conversion failed exceeding maximum wait time`);
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
        const [captureConnection, error] = await this.getCaptureConnection(item.quickgenId);

        if (error !== undefined) {
          // show error FIXME
          return;
        }

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
          const [captureConnection, error] = await this.getCaptureConnection(item.quickgenId);
          if (error !== undefined) {
            // show error FIXME
            return;
          }
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

  async getCaptureConnection(
    quickgenId: string | undefined
  ): Promise<Result<CaptureConnection, unknown>> {
    if (quickgenId !== undefined) {
      return [this.captureConnections.get(quickgenId)!, undefined];
    } else {
      return await getCaptureConnection(
        this.configuration,
        this.secrets,
        this.configuration.get<boolean>("internalUseDevEndpoints"),
        this.logger
      );
    }
  }

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    await this.sendLoadConfig();
    await this.sendRequest({
      command: "showCaptureWindow",
      payload: { items: this.items },
    });

    const [connection, error] = await this.getCaptureConnection(undefined);

    if (error !== undefined) {
      this.showGeneralError({
        message: "Failed to establish connection to capture server, please check your credentials.",
        details: `${error}`,
      });
      return;
    }

    await this.sendRequest({
      command: "setCaptureToken",
      payload: connection.token,
    });
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

  async uploadFile(
    captureConnection: CaptureConnection,
    item: CaptureItem,
    quickgenId: string,
    data_file: string,
    env_file: string | undefined
  ): Promise<Result<string, unknown>> {
    item.uploadStatus[data_file] = { percent: 0, fileId: undefined };

    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });

    const [fileId, uploadError] = await requestUpload(
      captureConnection,
      quickgenId,
      data_file,
      env_file,
      (percent: number) => {
        item.uploadStatus[data_file] = { percent, fileId: undefined };
        this.sendRequestSilently({
          command: "saveCapture",
          payload: item,
        });
      },
      this.logger
    );

    if (uploadError !== undefined) {
      return [undefined, uploadError];
    }

    item.uploadStatus[data_file] = { percent: 100, fileId };
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });

    return [fileId, undefined];
  }

  async getUploadSummary(
    captureConnection: CaptureConnection,
    quickgenId: string,
    item: CaptureItem
  ): Promise<string[]> {
    const uploadSummary: string[] = [];

    for (const [file, status] of Object.entries(item.uploadStatus)) {
      const filename = basename(vscode.Uri.parse(file));

      if (status.fileId !== undefined) {
        const [summary, error] = await requestSummary(
          captureConnection,
          quickgenId,
          status.fileId,
          this.logger
        );

        if (error !== undefined) {
          uploadSummary.push(`Failed to get summary for file ${filename}: ${getError(error)}`);
          continue;
        }

        for (const line of summary) {
          uploadSummary.push(`Error in "${filename}": ${line}`);
        }
      }
    }

    return uploadSummary;
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
      uploadStatus: {},
      status: "pending",
      log: [],
      downloadedFile: undefined,
    };
  }

  setPrepareOptions(itemOptions: PrepareOptions, options: PrepareOptions): void {
    itemOptions.basePath = options.basePath;
    itemOptions.servers = options.servers.map((e) => e.trim()).filter((e) => e.length > 0);
  }

  updateItem(item: CaptureItem, status: Status | undefined, message: string | string[]) {
    if (status !== undefined) {
      item.status = status;
    }
    if (Array.isArray(message)) {
      item.log.push(...message);
    } else {
      item.log.push(message);
    }
    return this.sendRequestSilently({
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

async function sortFiles(
  files: string[]
): Promise<{ env: string[]; postman: string[]; other: string[] }> {
  const env: string[] = [];
  const postman: string[] = [];
  const other: string[] = [];
  for (const file of files) {
    const type = await checkFileType(file);
    if (type === "env_file") {
      env.push(file);
    } else if (type === "postman_file") {
      postman.push(file);
    } else {
      other.push(file);
    }
  }
  return { env, postman, other };
}

async function checkFileType(uri: string): Promise<"env_file" | "postman_file" | "other"> {
  const filePath = vscode.Uri.parse(uri).fsPath;
  const parsed = await parseFile(filePath);

  if (parsed !== undefined && typeof parsed === "object" && Array.isArray(parsed?.["values"])) {
    return "env_file";
  } else if (parsed !== undefined && typeof parsed === "object") {
    return "postman_file";
  }

  return "other";
}

async function parseFile(filePath: string): Promise<any> {
  if (filePath.endsWith(".json")) {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
}
