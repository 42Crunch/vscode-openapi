/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Webapp } from "@xliic/common/webapp/data-dictionary";
import { ShowDictionaryMessage } from "@xliic/common/data-dictionary";
import { WebView } from "../../webapps/web-view";

export class DataDictionaryWebView extends WebView<Webapp> {
  hostHandlers = {
    noop: () => Promise.resolve(),
  };

  constructor(extensionPath: string) {
    super(extensionPath, "data-dictionary", "Data Dictionary", vscode.ViewColumn.One);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
  }

  async sendShowDictionaries(payload: ShowDictionaryMessage["payload"]) {
    await this.show();
    await this.sendRequest({ command: "showDictionary", payload });
  }
}
