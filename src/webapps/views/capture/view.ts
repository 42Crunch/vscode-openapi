/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as fs from "fs";
import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/capture";
import { WebView } from "../../web-view";

import { CaptureItem, PrepareOptions } from "@xliic/common/capture";
import FormData from "form-data";
import got from "got";
import { Configuration } from "../../../configuration";
import { getAnondCredentials } from "../../../credentials";
import { freemiumdUrl } from "@xliic/common/endpoints-dev";

const pollingDelayMs = 5 * 1000; // 5s
const pollingTimeMs = 5 * 60 * 1000; // 5min
const pollingLimit = Math.floor(pollingTimeMs / pollingDelayMs);

export type Status = "pending" | "running" | "finished" | "failed";

export class CaptureWebView extends WebView<Webapp> {
  private items: CaptureItem[];

  constructor(extensionPath: string, private configuration: Configuration) {
    super(extensionPath, "capture", "Capture", vscode.ViewColumn.One);
    this.items = [];
    //tempInitItems(this.items);
    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    browseFiles: async (payload: { id: string; options: PrepareOptions | undefined }) => {
      const uris = await vscode.window.showOpenDialog({
        title: "Select HAR/Postman files",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true,
        // filters: {
        //   OpenAPI: ["json", "yaml", "yml"],
        // },
      });
      const files: string[] = [];
      if (uris && Array.isArray(uris)) {
        uris.forEach((e) => files.push(e.fsPath));
      }
      let item;
      const id = payload.id;
      if (id) {
        item = this.items.filter((item) => item.id === id)[0];
        if (files.length > 0) {
          item.files = files;
        }
        if (payload.options) {
          item.prepareOptions = payload.options;
        }
      } else {
        item = this.getNewItem(files);
        this.items.unshift(item);
      }
      this.sendRequest({
        command: "saveCapture",
        payload: item,
      });
    },
    convert: async (payload: { id: string; files: string[]; options: PrepareOptions }) => {
      const anondToken = getAnondCredentials(this.configuration);
      const id = payload.id;
      const item = this.items.filter((item) => item.id === id)[0];
      item.isPrepareOptionsValid = true;
      this.setPrepareOptions(item.prepareOptions, payload.options);
      item.files = payload.files;
      item.log = [];
      item.downloadedFile = undefined;

      // Handle the case when restart requested
      if (item.quickgenId && item.progressStatus === "Failed") {
        try {
          await requestDelete(anondToken, item.quickgenId);
        } catch (error) {
          // Silent removal
        }
      }
      item.progressStatus = "In progress";

      // Prepare request -> capture server
      let quickgenId = "";
      try {
        quickgenId = await requestPrepare(anondToken, item.prepareOptions);
        this.showPrepareResponse(item, quickgenId, true, "");
      } catch (error) {
        this.showPrepareResponse(item, quickgenId, false, getError(error));
        return;
      }

      // Upload request -> capture server
      try {
        await requestUpload(anondToken, quickgenId, item.files, (percent: number) => {
          if (item.progressStatus != "Failed") {
            this.showPrepareUploadFileResponse(item, true, "", percent === 1.0, percent);
          }
        });
      } catch (error) {
        this.showPrepareUploadFileResponse(item, false, getError(error), false, 0.0);
        return;
      }

      // Start request -> capture server
      try {
        await requestStart(anondToken, quickgenId);
        this.showExecutionStartResponse(item, true, "");
      } catch (error) {
        this.showExecutionStartResponse(item, false, getError(error));
        return;
      }

      const refreshJobStatus = async (token: string, quickgenId: string) => {
        try {
          const status = await requestStatus(anondToken, quickgenId);
          item.pollingCounter += 1;
          this.showExecutionStatusResponse(item, status, true, "");
          const keepPolling = item.pollingCounter <= pollingLimit;
          if ((status === "pending" || status === "running") && keepPolling) {
            setTimeout(async () => {
              refreshJobStatus(token, quickgenId);
            }, pollingDelayMs);
          }
        } catch (error) {
          this.showExecutionStatusResponse(item, "finished", false, getError(error));
          return;
        }
      };

      // Wait for correct status request -> capture server
      refreshJobStatus(anondToken, quickgenId);
    },
    downloadFile: async (payload: { id: string; quickgenId: string }) => {
      const uri = await vscode.window.showSaveDialog({
        title: "Save OpenAPI file",
        filters: {
          OpenAPI: ["json", "yaml", "yml"],
        },
      });
      if (uri) {
        const id = payload.id;
        const item = this.items.filter((item) => item.id === id)[0];
        try {
          const anondToken = getAnondCredentials(this.configuration);
          const fileText = await requestDownload(anondToken, payload.quickgenId);
          const encoder = new TextEncoder();
          await vscode.workspace.fs.writeFile(
            uri,
            encoder.encode(JSON.stringify(fileText, null, 2))
          );
          this.showDownloadResult(item, uri.fsPath, true, "");
        } catch (error) {
          this.showDownloadResult(item, uri.fsPath, false, getError(error));
        }
      }
    },
    deleteJob: async (payload: { id: string; quickgenId: string }) => {
      let index = -1;
      const id = payload.id;
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].id === id) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        this.items.splice(index, 1);
      }
      try {
        const anondToken = getAnondCredentials(this.configuration);
        await requestDelete(anondToken, payload.quickgenId);
      } catch (error) {
        // Silent removal
      }
    },
    openLink: async (payload: string) => {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(payload));
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    this.sendRequest({
      command: "showCaptureWindow",
      payload: this.items,
    });
  }

  async showCaptureWebView() {
    await this.show();
  }

  getNewItem(files: string[]): CaptureItem {
    return {
      id: crypto.randomUUID(),
      files: files,
      quickgenId: undefined,
      prepareOptions: {
        basePath: "/",
        servers: [],
      },
      isPrepareOptionsValid: false, // Due to empty servers
      progressStatus: "New",
      pollingCounter: 0,
      log: [],
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
      item.progressStatus = "In progress";
      item.log.push(`Job ${quickgenId} has been created`);
    } else {
      item.progressStatus = "Failed";
      item.log.push("Failed to prepare: " + error);
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
        item.log.push("All files have been uploaded");
      } else {
        percent = Math.ceil(100 * percent);
        if (log[log.length - 1].startsWith("Uploading files")) {
          log[log.length - 1] = `Uploading files: ${percent}%`;
        } else {
          log.push(`Uploading files: ${percent}%`);
        }
      }
    } else {
      item.progressStatus = "Failed";
      item.log.push("Failed to upload: " + error);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showExecutionStartResponse(item: CaptureItem, success: boolean, message: string) {
    if (success) {
      item.log.push("Job has been started");
    } else {
      item.progressStatus = "Failed";
      item.log.push("Job failed to start: " + message);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showExecutionStatusResponse(item: CaptureItem, status: Status, success: boolean, error: string) {
    if (success) {
      const log = item.log;
      if (log[log.length - 1].startsWith("Job status: ")) {
        log[log.length - 1] = `Job status: ${status}`;
      } else {
        log.push(`Job status: ${status}`);
      }
      if (status === "finished") {
        item.progressStatus = "Finished";
      } else if (status === "failed") {
        item.progressStatus = "Failed";
      }
    } else {
      item.progressStatus = "Failed";
      item.log.push("Job execution failed: " + error);
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
}

export async function requestPrepare(token: string, prepareOptions: PrepareOptions) {
  const response = await got(`${freemiumdUrl}/capture/api/1.0/quickgen/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${token}`,
    },
    json: {
      base_path: prepareOptions.basePath,
      servers: prepareOptions.servers,
    },
  });
  return JSON.parse(response.body)["quickgen_id"];
}

export async function requestUpload(
  token: string,
  quickgenId: string,
  files: string[],
  listener: (percent: number) => void
) {
  const form = new FormData();
  for (const file of files) {
    const fsPath = vscode.Uri.file(file).fsPath;
    form.append("file", fs.createReadStream(fsPath));
  }
  const response = await got(
    `${freemiumdUrl}/capture/api/1.0/quickgen/${quickgenId}/prepare/upload-file`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
      },
      body: form,
    }
  ).on("uploadProgress", (progress) => {
    listener(progress.percent);
  });
  return JSON.parse(response.body);
}

export async function requestStart(token: string, quickgenId: string) {
  const response = await got(
    `${freemiumdUrl}/capture/api/1.0/quickgen/${quickgenId}/execution/start`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
    }
  );
  return JSON.parse(response.body);
}

export async function requestStatus(token: string, quickgenId: string) {
  const response = await got(
    `${freemiumdUrl}/capture/api/1.0/quickgen/${quickgenId}/execution/status`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
    }
  );
  return JSON.parse(response.body)["status"];
}

export async function requestDownload(token: string, quickgenId: string) {
  const response = await got(
    `${freemiumdUrl}/capture/api/1.0/quickgen/${quickgenId}/results/openapi`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
    }
  );
  return JSON.parse(response.body);
}

export async function requestDelete(token: string, quickgenId: string) {
  const response = await got(`${freemiumdUrl}/capture/api/1.0/quickgen/${quickgenId}/delete`, {
    method: "DELETE",
    headers: {
      Authorization: `token ${token}`,
    },
  });
  return JSON.parse(response.body);
}

function getError(error: any): string {
  if (error?.response?.body && error?.response?.body.includes("detail")) {
    const detail = JSON.parse(error?.response?.body)["detail"];
    return `${error}, ${detail}`;
  }
  return `${error}`;
}
