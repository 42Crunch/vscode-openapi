/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as fs from "fs";

export function create(context: vscode.ExtensionContext) {
  const filename = context.asAbsolutePath("webview/whatsnew.html");
  const contents = fs.readFileSync(filename, { encoding: "utf8" });
  const panel = vscode.window.createWebviewPanel(
    "whatsNew",
    "What's new in OpenAPI Editor",
    vscode.ViewColumn.Active,
    { enableCommandUris: true }
  );
  panel.webview.html = contents;
  return panel;
}
