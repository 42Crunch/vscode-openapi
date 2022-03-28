/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";

export class WebView {
  private style: vscode.Uri;
  private script: vscode.Uri;

  constructor(
    extensionPath: string,
    private viewId: string,
    private viewTitle: string,
    private column: vscode.ViewColumn
  ) {
    this.script = vscode.Uri.file(
      path.join(extensionPath, "webview", "generated", viewId, "index.js")
    );
    this.style = vscode.Uri.file(
      path.join(extensionPath, "webview", "generated", viewId, "style.css")
    );
  }

  createPanel(): Promise<vscode.WebviewPanel> {
    const panel = vscode.window.createWebviewPanel(
      this.viewId,
      this.viewTitle,
      {
        viewColumn: this.column,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.getHtml(
      panel.webview.cspSource,
      panel.webview.asWebviewUri(this.script),
      panel.webview.asWebviewUri(this.style)
    );

    return new Promise((resolve, reject) => {
      panel.webview.onDidReceiveMessage((message: any) => {
        if (message.command === "started") {
          resolve(panel);
        }
      });
    });
  }

  private getHtml(cspSource: string, script: vscode.Uri, style: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src ${cspSource} https: data:; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource}  'unsafe-inline'; connect-src http: https:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${style}" rel="stylesheet">
      <style>
        :root {
          --xliic-foreground: var(
            --xliic-custom-foreground,
            var(--vscode-editor-foreground)
          );
          --xliic-background: var(
            --xliic-custom-background,
            var(--vscode-editor-background)
          );
          --xliic-button-background: var(
            --xliic-custom-button-background,
            var(--vscode-button-background)
          );
          --xliic-button-foreground: var(
            --xliic-custom-button-foreground,
            var(--vscode-button-foreground)
          );
          --xliic-button-hoverBackground: var(
            --xliic-custom-button-hoverBackground,
            var(--vscode-button-hoverBackground)
          );
        }
        #root .btn-primary {
          --bs-btn-bg: var(--xliic-button-background);
          --bs-btn-hover-bg: var(--xliic-button-hoverBackground);
          --bs-btn-color: var(--xliic-button-foreground);
          --bs-btn-hover-color: var(--xliic-button-foreground);
          --bs-btn-border-color: var(--xliic-button-background);
          --bs-btn-hover-border-color: var(--xliic-button-hoverBackground);
        }
      </style>
    </head>
    <body>
    <div id="root"></div>  
    <script src="${script}"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        window.renderWebView(vscode);
        vscode.postMessage({command: "started"});
      });
    </script>
    </body>
    </html>`;
  }
}
