/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';

export const decorationType = vscode.window.createTextEditorDecorationType({});

export function createDecoration(issues): vscode.DecorationOptions[] {
  const options: vscode.DecorationOptions[] = [];

  const issueLines = {};

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const line = issue.range.start.line;
    const issuesPerLine = issueLines[line] ? issueLines[line] : [];
    issuesPerLine.push({ issue, issueId: i });
    issueLines[line] = issuesPerLine;
  }

  // sort
  for (const lineNo of Object.keys(issueLines)) {
    issueLines[lineNo].sort((a, b) => a.issue.score - b.issue.score);
  }

  for (const lineNo of Object.keys(issueLines)) {
    const lineNoInt = parseInt(lineNo, 10);

    const issueIds = issueLines[lineNo].map(({ issue, issueId }) => issueId);

    const commandUri = vscode.Uri.parse(
      `command:openapi.focusSecurityAuditById?${encodeURIComponent(JSON.stringify(issueIds))}`,
    );

    const count = issueLines[lineNo].length;

    const markdown = `[View detailed report for ${count} OpenAPI issue(s)](${commandUri})`;

    const down = new vscode.MarkdownString(markdown);

    down.isTrusted = true;

    const range = new vscode.Range(
      new vscode.Position(lineNoInt, 0),
      new vscode.Position(lineNoInt, 160),
    );

    const decoration = {
      range: range,
      hoverMessage: down,
    };
    options.push(decoration);
  }

  return options;
}
