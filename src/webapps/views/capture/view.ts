/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/capture";
import { Configuration } from "../../../configuration";
import { WebView } from "../../web-view";
import { PlatformStore } from "../../../platform/stores/platform-store";
import { Logger } from "../../../platform/types";

import { HttpConfig, HttpError, HttpRequest } from "@xliic/common/http";
import { executeHttpRequestRaw } from "../../http-handler";
import { loadConfig } from "../../../util/config";
import { FilesList, PrepareOptions, QuickGenId, Status } from "@xliic/common/capture";
import { delay } from "../../../time-util";

//export const CAPTURE_DATA_KEY = "openapi-42crunch.environment-capture-data";

export class CaptureWebView extends WebView<Webapp> {
  private uri: vscode.Uri | undefined;
  private statuses: string[] = ["pending", "running", "running", "running", "finished"];
  private statusIndex = 0;

  constructor(
    extensionPath: string
    // private memento: vscode.Memento,
    // private configuration: Configuration,
    // private secrets: vscode.SecretStorage,
    // private platform: PlatformStore,
    // private logger: Logger
  ) {
    super(extensionPath, "capture", "Capture Files Convert", vscode.ViewColumn.One);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    browseFiles: async (payload: undefined) => {
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
      this.sendRequest({
        command: "browseFilesComplete",
        payload: { files },
      });
    },
    prepare: async (payload: PrepareOptions) => {
      // TODO: send prepare request to the capture server
      // PrepareResponse = { success: true; quickgen_id: string } | ResponseError
      await delay(1000);
      this.sendRequest({
        command: "showPrepareResponse",
        payload: { success: true, quickgenId: "qwewqeq-21321312-qewqeqw-eqw-e12-31-qwq" },
      });
    },
    prepareUploadFile: async (payload: QuickGenId & FilesList) => {
      // TODO: send prepare request to the capture server
      // export type UploadFileResponse =
      // | { completed: false; progress: UploadFileProgress }
      // | { completed: true; success: true }
      // | { completed: true; success: false; error: string };
      const n = 10;
      for (let i = 0; i <= n; i++) {
        await delay(200);
        this.sendRequest({
          command: "showPrepareUploadFileResponse",
          payload: {
            completed: false,
            progress: {
              percent: i / n,
            },
          },
        });
      }
      await delay(100);
      this.sendRequest({
        command: "showPrepareUploadFileResponse",
        payload: { completed: true, success: true },
      });
    },
    executionStart: async (payload: QuickGenId) => {
      // TODO: send start request to the capture server
      // ExecutionStartResponse = { success: boolean; message: string };
      await delay(1000);
      this.sendRequest({
        command: "showExecutionStartResponse",
        payload: { success: true, message: "ok, but not used" },
      });
    },
    executionStatus: async (payload: QuickGenId) => {
      // TODO: send status request to the capture server
      // export type ShowExecutionStatusResponse = {
      //   command: "showExecutionStatusResponse";
      //   payload: ExecutionStatusResponse;
      // };
      if (this.statusIndex < this.statuses.length) {
        const status = this.statuses[this.statusIndex];
        this.statusIndex += 1;
        this.sendRequest({
          command: "showExecutionStatusResponse",
          payload: {
            success: true,
            status: status as Status,
            message: "ok, not used yet",
          },
        });
      } else {
        this.sendRequest({
          command: "showExecutionStatusResponse",
          payload: {
            success: true,
            status: "finished" as Status,
            message: "ok, not used yet",
          },
        });
      }
    },
    downloadResult: async (payload: QuickGenId) => {
      // TODO: send download request to the capture server
      // DownloadResultResponse = { success: true; file: string } | ResponseError;
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
      this.sendRequest({
        command: "showDownloadResult",
        payload: { success: true, file: uri ? uri.fsPath : "" },
      });
    },
    openLink: async (payload: string) => {
      //console.info("openLink=" + payload);
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(payload));
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    },
  };

  async onStart() {
    this.statusIndex = 0;
    await this.sendColorTheme(vscode.window.activeColorTheme);
    //const config = await loadConfig(this.configuration, this.secrets);
    this.sendRequest({
      command: "showCaptureWindow",
      payload: undefined,
    });
    // const tagData = this.memento.get(TAGS_DATA_KEY, {}) as TagData;
    // const targetFileName = this.uri?.fsPath;
    // if (targetFileName) {
    //   if (!tagData[targetFileName]) {
    //     tagData[targetFileName] = [] as TagEntry[];
    //   }
    //   this.sendRequest({
    //     command: "loadCapture",
    //     payload: { targetFileName, data: tagData },
    //   });
    // }
  }

  async showCaptureWebView() {
    //this.uri = uri;
    await this.show();
  }
}
