/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import { readFile } from "node:fs/promises";
import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/bigfiles";
import { WebView } from "../../web-view";

import { Configuration } from "../../../configuration";

export class BigFilesWebView extends WebView<Webapp> {
  constructor(extensionPath: string, private configuration: Configuration) {
    super(extensionPath, "bigfiles", "Test BigFiles", vscode.ViewColumn.One);
    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    browseFile: async (payload: undefined) => {
      const uri = await vscode.window.showOpenDialog({
        title: "Select Big Audit Report File",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
      });
      if (uri) {
        this.sendRequest({
          command: "showBrowseFile",
          payload: { file: uri[0].fsPath },
        });
      }
    },
    convert: async (payload: { file: string }) => {
      const file = payload.file;
      const report = await readFile(file, { encoding: "utf8" });
      const n = 10;
      let offset = 0;
      let chunkSize = Math.ceil(report.length / n);
      for (let i = 1; i <= n; i++) {
        if (report.length - offset < chunkSize) {
          chunkSize = report.length - offset;
        }
        const textSegment = report.substr(offset, chunkSize);
        offset += chunkSize;
        this.sendRequest({
          command: "sendFileSegment",
          payload: { file, textSegment, progress: i / n },
        });
      }
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
  }

  async showBigFilesWebView() {
    await this.show();
  }
}
