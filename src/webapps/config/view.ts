/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/config";
import { WebView } from "../../web-view";

export class ConfigWebView extends WebView<Webapp> {
  constructor(extensionPath: string) {
    super(extensionPath, "config", "Settings", vscode.ViewColumn.One, false);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    saveConfig: async (config: any) => {
      vscode.workspace
        .getConfiguration("openapi")
        .update("tryit.insecureSslHostnames", config.insecureSslHostnames);
    },
  };
}
