/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { basename } from "path";
import * as vscode from "vscode";
import { AuditContext, DocumentDecorations } from "../types";

export const decorationType = vscode.window.createTextEditorDecorationType({});

export function setDecorations(editor: vscode.TextEditor, auditContext: AuditContext) {
  if (auditContext.decorations[editor.document.uri.toString()]) {
    editor.setDecorations(decorationType, auditContext.decorations[editor.document.uri.toString()]);
  }
}

export function updateDecorations(
  decorations: DocumentDecorations,
  mainUri: string,
  issues: any
): DocumentDecorations {
  const mainFilename = basename(vscode.Uri.parse(mainUri).fsPath);

  for (const [uri, issuez] of Object.entries(issues)) {
    decorations[uri] = createDecoration(mainUri, mainFilename, issuez);
  }

  return decorations;
}

function createDecoration(
  mainUri: string,
  mainFilename: string,
  issues: any
): vscode.DecorationOptions[] {
  const options: vscode.DecorationOptions[] = [];

  const issueLines: any = {};

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const line = issue.range.start.line;
    const issuesPerLine = issueLines[line] ? issueLines[line] : [];
    issuesPerLine.push({ issue, issueId: i });
    issueLines[line] = issuesPerLine;
  }

  // sort
  for (const lineNo of Object.keys(issueLines)) {
    issueLines[lineNo].sort((a: any, b: any) => a.issue.score - b.issue.score);
  }

  for (const lineNo of Object.keys(issueLines)) {
    const lineNoInt = parseInt(lineNo, 10);
    const issueIds = issueLines[lineNo].map((line: any) => line.issueId);
    const base64Uri = Buffer.from(mainUri).toString("base64");

    const params = {
      ids: issueIds,
      uri: base64Uri,
    };

    const commandUri = vscode.Uri.parse(
      `command:openapi.focusSecurityAuditById?${encodeURIComponent(JSON.stringify(params))}`
    );

    const count = issueLines[lineNo].length;

    const markdown = `[View detailed report for ${count} OpenAPI issue(s) in audit of ${mainFilename}](${commandUri})`;

    const down = new vscode.MarkdownString(markdown);

    down.isTrusted = true;

    const range = new vscode.Range(
      new vscode.Position(lineNoInt, 0),
      new vscode.Position(lineNoInt, 160)
    );

    const decoration = {
      range: range,
      hoverMessage: down,
    };
    options.push(decoration);
  }

  return options;
}
