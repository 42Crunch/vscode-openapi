/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { OasWithOperation, TryItRequest, TryItResponse } from "@xliic/common/messages/tryit";

import { WebView } from "../web-view";
import { executeHttpRequest } from "./http-handler";
import { executeCurlRequest } from "./curl-handler";
import { executeCreateSchemaRequest } from "./create-schema-handler";
import { Cache } from "../cache";

export class TryItWebView extends WebView<TryItRequest, TryItResponse> {
  private document?: vscode.TextDocument;
  responseHandlers = {
    sendRequest: executeHttpRequest,
    sendCurl: executeCurlRequest,
    createSchema: async (response: any) => {
      executeCreateSchemaRequest(this.document!, this.cache, response);
    },
    saveConfig: async (config: any) => {
      vscode.workspace
        .getConfiguration("openapi")
        .update("tryit.insecureSslHostnames", config.insecureSslHostnames);
    },
  };

  constructor(extensionPath: string, private cache: Cache) {
    super(extensionPath, "scan", "Try It", vscode.ViewColumn.Two);
  }

  async sendTryOperation(document: vscode.TextDocument, payload: OasWithOperation) {
    this.document = document;
    return this.sendRequest({ command: "tryOperation", payload });
  }
}
