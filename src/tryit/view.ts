/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { OasWithOperation, TryItRequest, TryItResponse } from "@xliic/common/messages/tryit";

import { WebView } from "../web-view";
import { executeHttpRequest } from "./http-handler";
import { executeCurlRequest } from "./curl-handler";

export class TryItWebView extends WebView<TryItRequest, TryItResponse> {
  responseHandlers = {
    sendRequest: executeHttpRequest,
    sendCurl: executeCurlRequest,
  };

  constructor(extensionPath: string) {
    super(extensionPath, "scan", "Try It", vscode.ViewColumn.Two);
  }

  async sendTryOperation(payload: OasWithOperation) {
    return this.sendRequest({ command: "tryOperation", payload });
  }
}
