/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Webapp } from "@xliic/common/webapp/audit";
import { WebView } from "../web-view";
import { Cache } from "../cache";
import { getLocationByPointer } from "./util";
import { getArticles } from "./client";
import { Audit } from "../types";

export class AuditWebView extends WebView<Webapp> {
  private kdb?: Promise<any>;

  hostHandlers: Webapp["hostHandlers"] = {
    copyIssueId: async (issueId: string) => {
      vscode.env.clipboard.writeText(issueId);
      const disposable = vscode.window.setStatusBarMessage(`Copied ID: ${issueId}`);
      setTimeout(() => disposable.dispose(), 1000);
    },

    goToLine: async ({ uri, line, pointer }: { uri: string; line: number; pointer: string }) => {
      this.focusLine(uri, pointer, line);
    },

    openLink: async (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    },
  };

  constructor(extensionPath: string, private cache: Cache) {
    super(extensionPath, "audit", "Security Audit Report", vscode.ViewColumn.Two, true);
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

  async showReport(report: Audit) {
    const kdb = await this.getKdb();
    await this.show();
    this.sendRequest({ command: "loadKdb", payload: kdb });
    return this.sendRequest({ command: "showFullReport", payload: report as any });
  }

  public async showIds(report: Audit, uri: string, ids: any[]) {
    const kdb = await this.getKdb();
    await this.show();
    this.sendRequest({ command: "loadKdb", payload: kdb });
    this.sendRequest({
      command: "showPartialReport",
      payload: { report: report as any, uri, ids },
    });
  }

  public async showIfVisible(report: Audit) {
    if (this.isActive()) {
      this.sendRequest({ command: "loadKdb", payload: await this.getKdb() });
      return this.sendRequest({ command: "showFullReport", payload: report as any });
    }
  }

  public async showNoReport() {
    if (this.isActive()) {
      return this.sendRequest({ command: "showNoReport", payload: undefined });
    }
  }

  private async focusLine(uri: string, pointer: string, line: number) {
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
      lineNo = line;
    }

    const textLine = editor.document.lineAt(lineNo);
    editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
    editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
  }
}
