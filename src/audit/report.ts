/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";
import { Audit } from "../types";
import { readFileSync } from "fs";
import { getArticles } from "./client";
import { Cache } from "../cache";
import { getLocationByPointer } from "./util";

export class AuditReportWebView {
  private panel?: vscode.WebviewPanel;
  private style: string;
  private script: vscode.Uri;
  private cache: Cache;
  private _disposables: vscode.Disposable[] = [];
  private kdb?: Promise<any>;

  constructor(extensionPath: string, cache: Cache) {
    this.cache = cache;

    this.script = vscode.Uri.file(
      path.join(extensionPath, "webview", "generated", "audit", "index.js")
    );

    this.style = readFileSync(
      path.join(extensionPath, "webview", "generated", "audit", "style.css"),
      { encoding: "utf-8" }
    );
  }

  public prefetchKdb() {
    this.kdb = getArticles();
  }

  private async getKdb() {
    if (this.kdb !== undefined) {
      return this.kdb;
    }
    this.prefetchKdb();
    return this.kdb;
  }

  public async show(report: Audit) {
    if (!this.panel) {
      this.panel = await this.createPanel(await this.getKdb());
    }
    this.panel.webview.postMessage({ command: "showFullReport", report });
  }

  public async showIds(report: Audit, uri: string, ids: any[]) {
    if (!this.panel) {
      this.panel = await this.createPanel(await this.getKdb());
    }
    this.panel.webview.postMessage({ command: "showPartialReport", report, uri, ids });
  }

  public showIfVisible(report: Audit) {
    if (this.panel && this.panel.visible) {
      this.panel.webview.postMessage({ command: "showFullReport", report });
    }
  }

  public async showNoReport() {
    if (this.panel && this.panel.visible) {
      this.panel.webview.postMessage({ command: "showNoReport" });
    }
  }

  private async focusLine(uri: string, pointer: string, line: string) {
    let editor: vscode.TextEditor | undefined = undefined;

    // check if document is already open
    for (const visibleEditor of vscode.window.visibleTextEditors) {
      if (visibleEditor.document.uri.toString() == uri) {
        editor = visibleEditor;
      }
    }

    if (!editor) {
      // if not already open, load and show it
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
      editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    }

    let lineNo: number;

    const root = this.cache.getParsedDocument(editor.document);
    if (root) {
      // use pointer by default
      lineNo = getLocationByPointer(editor.document, root, pointer)[0];
    } else {
      // fallback to line no
      lineNo = parseInt(line, 10);
    }

    const textLine = editor.document.lineAt(lineNo);
    editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
    editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
  }

  public dispose() {
    this.panel?.dispose();
    this.panel = undefined;
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private createPanel(kdb: any): Promise<vscode.WebviewPanel> {
    const panel = vscode.window.createWebviewPanel(
      "security-audit-report",
      "Security Audit Report",
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.getHtml(
      panel.webview.cspSource,
      kdb,
      panel.webview.asWebviewUri(this.script),
      this.style
    );

    vscode.window.onDidChangeActiveColorTheme(
      (event) => {
        const kind = event.kind === vscode.ColorThemeKind.Light ? "light" : "dark";
        this.panel?.webview.postMessage({ command: "changeTheme", kind });
      },
      null,
      this._disposables
    );

    panel.onDidDispose(() => this.dispose(), null, this._disposables);

    return new Promise((resolve, reject) => {
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "started":
              resolve(panel);
              return;
            case "copyIssueId":
              vscode.env.clipboard.writeText(message.id);
              const disposable = vscode.window.setStatusBarMessage(`Copied ID: ${message.id}`);
              setTimeout(() => disposable.dispose(), 1000);
              return;
            case "goToLine":
              this.focusLine(message.uri, message.pointer, message.line);
              return;
            case "openLink":
              vscode.env.openExternal(vscode.Uri.parse(message.href));
              return;
          }
        },
        null,
        this._disposables
      );
    });
  }

  private getHtml(cspSource: string, kdb: any, script: vscode.Uri, style: string): string {
    const themeKind =
      vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.Light ? "light" : "dark";

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src ${cspSource} https: data:; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource}  'unsafe-inline'; connect-src http: https:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${style}</style>
      <style>
        :root {
          --audit-foreground: var(
            --audit-custom-foreground,
            var(--vscode-editor-foreground)
          );
          --audit-background: var(
            --audit-custom-background,
            var(--vscode-editor-background)
          );
        }
      </style>
    </head>
    <body>
    <div id="root"></div>
    <script type="application/json" id="kdb">${JSON.stringify(kdb)}</script>
  
    <script src="${script}"></script>
    <script>
    window.addEventListener("DOMContentLoaded", (event) => {
      const kdb = JSON.parse(document.getElementById("kdb").textContent);
      const vscode = acquireVsCodeApi();
      window.renderAuditReport(vscode, kdb, {kind: "${themeKind}"});
      vscode.postMessage({command: "started"});
    });
    </script>
    </body>
    </html>`;
  }
}
