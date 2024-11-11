/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as fs from "fs";

function getHtml(contents: string): string {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https://github.com https://raw.githubusercontent.com;">
  </head>
  <body>
${contents}
  </body>
  </html>`;
}

export function create(context: vscode.ExtensionContext) {
  const filename = context.asAbsolutePath("webview/generated/whatsnew.html");
  const contents = fs.readFileSync(filename, { encoding: "utf8" });
  const panel = vscode.window.createWebviewPanel(
    "whatsNew",
    "What's new in OpenAPI Editor",
    vscode.ViewColumn.Active,
    { enableCommandUris: true }
  );
  panel.webview.html = getHtml(contents);
  return panel;
}
