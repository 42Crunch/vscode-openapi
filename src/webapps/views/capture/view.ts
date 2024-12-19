/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/capture";
import { WebView } from "../../web-view";

import { CaptureItem, PrepareOptions } from "@xliic/common/capture";
import { delay } from "../../../time-util";

export type Status = "pending" | "running" | "finished" | "failed";

export class CaptureWebView extends WebView<Webapp> {
  private uri: vscode.Uri | undefined;
  private items: CaptureItem[];

  constructor(
    extensionPath: string
    // private memento: vscode.Memento,
    // private configuration: Configuration,
    // private secrets: vscode.SecretStorage,
    // private platform: PlatformStore,
    // private logger: Logger
  ) {
    super(extensionPath, "capture", "Capture Files Convert", vscode.ViewColumn.One);
    this.items = [];
    tempInitItems(this.items);
    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    browseFiles: async (payload: { id: string; options: PrepareOptions | undefined }) => {
      const uris = await vscode.window.showOpenDialog({
        title: "Select HAAR or postman files",
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
      const id = payload.id;
      const item = this.items.filter((item) => item.id === id)[0];
      item.files = payload.files;
      item.prepareOptions = payload.options;

      if (item.quickgenId && item.progressStatus === "Failed") {
        // Restart requested
        item.progressStatus = "In progress";
        item.log = [];
        item.downloadedFile = undefined;
        // TODO: delete item.quickgenId on the server!!!
      }
      // TODO: send prepare request and get quickgenId
      const quickgenId = "QWEdsaddr615er1ytfehcvaghU9";
      await delay(1000);
      this.showPrepareResponse(item, quickgenId, true, "");

      // TODO: upload files request
      await delay(1000);
      const n = 10;
      for (let i = 0; i <= n; i++) {
        await delay(300);
        this.showPrepareUploadFileResponse(item, false, i / n);
      }
      await delay(300);
      this.showPrepareUploadFileResponse(item, true, 1.0);

      // TODO: send start request
      await delay(1000);
      this.showExecutionStartResponse(item, true, "ok, but not used yet");

      // TODO: send status request
      const statuses: string[] = ["pending", "running", "running", "running", "finished"];
      for (const status of statuses) {
        await delay(1000);
        this.showExecutionStatusResponse(item, status as Status, true, "ok, not used yet");
      }
    },
    downloadFile: async (payload: { id: string; quickgenId: string }) => {
      // TODO: send download request to the capture server
      const uri = await vscode.window.showSaveDialog({
        title: "Save OpenAPI file",
        //defaultUri: "Uri",
        filters: {
          OpenAPI: ["json", "yaml", "yml"],
        },
      });
      if (uri) {
        // todo: save downloaded file
        const example = {
          openapi: "3.0.2",
        };
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(JSON.stringify(example, null, 2)));
      }
      const id = payload.id;
      const item = this.items.filter((item) => item.id === id)[0];
      this.showDownloadResult(item, uri ? uri.fsPath : "", true, "");
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
      // TODO: send delete request with quickgenId
    },
    openLink: async (payload: string) => {
      //console.info("openLink=" + payload);
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(payload));
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    //const config = await loadConfig(this.configuration, this.secrets);
    this.sendRequest({
      command: "showCaptureWindow",
      payload: this.items,
    });
  }

  async showCaptureWebView() {
    //this.uri = uri;
    await this.show();
  }

  getNewItem(files: string[]): CaptureItem {
    return {
      id: crypto.randomUUID(),
      files: files,
      quickgenId: undefined,
      prepareOptions: {
        basePath: "",
        servers: [],
      },
      progressStatus: "New",
      log: [],
      downloadedFile: undefined,
    };
  }

  showPrepareResponse(item: CaptureItem, quickgenId: string, success: boolean, error: string) {
    if (success) {
      item.quickgenId = quickgenId;
      item.progressStatus = "In progress";
      item.log.push(`Job ${quickgenId} has been created`);
    } else {
      item.progressStatus = "Failed";
      item.log.push("Failed to create job: " + error);
    }
    this.sendRequestSilently({
      command: "saveCapture",
      payload: item,
    });
  }

  showPrepareUploadFileResponse(item: CaptureItem, completed: boolean, percent: number) {
    if (completed) {
      item.log.push("All files have been uploaded");
    } else {
      const log = item.log;
      percent = 100 * percent;
      if (log[log.length - 1].startsWith("Uploading files")) {
        log[log.length - 1] = `Uploading files: ${percent}%`;
      } else {
        log.push(`Uploading files: ${percent}%`);
      }
    }
    // todo: handle error
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

// TODO: only to dev, remove later
function tempInitItems(items: CaptureItem[]): void {
  [
    {
      id: "weqweqwq",
      files: ["d:\\work\\crunch\\ide-openapi-tests\\tryit\\httpbin-multipart.yaml"],
      quickgenId: "aasdsaddr615er1ytfeghcvaghd1",
      prepareOptions: {
        basePath: "/basePath1",
        servers: [],
      },
      progressStatus: "Finished",
      log: ["logMessage1"],
      downloadedFile: undefined,
    },
    {
      id: "weqweqwq2131",
      files: [
        "d:\\work\\crunch\\ide-openapi-tests\\tryit\\httpbin-multipart.yaml",
        "d:\\work\\crunch\\ide-openapi-tests\\tryit\\httpbin-multipart.yaml",
      ],
      quickgenId: "bbbdsaddr615er1ytfeghcvaghd1",
      prepareOptions: {
        basePath: "/basePath2",
        servers: [],
      },
      progressStatus: "In progress",
      log: ["logMessage1", "logMessage2"],
      downloadedFile: undefined,
    },
    {
      id: "weqweqwq4363463gsdgsd",
      files: [
        "d:\\work\\crunch\\ide-openapi-tests\\tryit\\httpbin-multipart.yaml",
        "d:\\work\\crunch\\ide-openapi-tests\\tryit\\httpbin-multipart.yaml",
        "d:\\work\\crunch\\ide-openapi-tests\\tryit\\httpbin-multipart.yaml",
      ],
      quickgenId: "tredsaddr615er1ytfeghcvaghd1",
      prepareOptions: {
        basePath: "/basePath3",
        servers: [],
      },
      progressStatus: "Failed",
      log: ["logMessage1", "logMessage2", "logMessageErrorHere"],
      downloadedFile: undefined,
    },
  ].forEach((item) => items.push(item as CaptureItem));
}
