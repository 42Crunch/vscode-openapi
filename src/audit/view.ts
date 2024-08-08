/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Webapp } from "@xliic/common/webapp/audit";
import { Audit } from "@xliic/common/audit";

import { WebView } from "../webapps/web-view";
import { Cache } from "../cache";
import { getLocationByPointer } from "./util";
import { getArticles } from "./client";

export type Target = {
  type: "full" | "partial";
  report: Audit;
  uri: string;
  ids: any[];
};

export class AuditWebView extends WebView<Webapp> {
  private kdb?: Promise<any>;
  private target?: Target;

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
    super(extensionPath, "audit", "Security Audit Report", vscode.ViewColumn.Two);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    await this.sendRequest({ command: "loadKdb", payload: await this.getKdb() });
    if (this.target && this.target.type === "full") {
      await this.sendRequest({ command: "showFullReport", payload: this.target.report });
    } else if (this.target && this.target.type === "partial") {
      const { report, uri, ids } = this.target;
      await this.sendRequest({ command: "showPartialReport", payload: { report, uri, ids } });
    }
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

  async sendStartAudit() {
    await this.show();
    await this.sendRequest({ command: "startAudit", payload: undefined });
  }

  async sendCancelAudit() {
    return this.sendRequest({ command: "cancelAudit", payload: undefined });
  }

  async showReport(report: Audit) {
    this.target = { type: "full", report, uri: "", ids: [] };
    await this.show();
  }

  public async showIds(report: Audit, uri: string, ids: any[]) {
    this.target = { type: "partial", report, uri, ids };
    await this.show();
  }

  public async showIfVisible(report: Audit) {
    if (this.isActive()) {
      return this.sendRequest({ command: "showFullReport", payload: report });
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
