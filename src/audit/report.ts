/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from 'path';
import * as vscode from 'vscode';
import { Audit, Summary } from './types';

import articles from './articles.json';

const fallbackArticle = {
  description: {
    text: `<p>Whoops! Looks like there has been an oversight and we are missing a page for this issue.</p>
           <p><a href="https://apisecurity.io/contact-us/">Let us know</a> the title of the issue, and we make sure to add it to the encyclopedia.</p>`,
  },
};

function articleById(id: string) {
  function partToText(part) {
    if (!part || !part.sections) {
      return '';
    }
    return part.sections.map((section) => `${section.text || ''}${section.code || ''}`).join('');
  }

  const article = articles[id] || fallbackArticle;

  return [
    article ? article.description.text : '',
    partToText(article.example),
    partToText(article.exploit),
    partToText(article.remediation),
  ].join('');
}

function getHtml(
  nonce: string,
  webview: vscode.Webview,
  styleUrl: vscode.Uri,
  scriptUrl: vscode.Uri,
  summary: string,
  issues: string,
  uri: string,
): string {
  const base64Uri = Buffer.from(uri).toString('base64');
  const backToReport = summary
    ? ''
    : `<h4><a class="go-full-report" data-uri="${base64Uri}" href="#">Go back to full report</a></h4>`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${
    webview.cspSource
  }; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Contract Security Audit Report</title>
      <link rel="stylesheet" href="${styleUrl}">
  </head>
  <body>
      <script nonce="${nonce}" src="${scriptUrl}"></script>
      ${summary || ''}
      ${issues || ''}
      ${backToReport}
  </body>
  </html>`;
}

function getIssueHtml(uri: string, filename: string, issue) {
  const criticalityNames = {
    5: 'Critical',
    4: 'High',
    3: 'Medium',
    2: 'Low',
    1: 'Info',
  };

  const criticality = criticalityNames[issue.criticality];
  const scoreImpact = issue.displayScore !== '0' ? `Score impact: ${issue.displayScore}` : '';
  const article = articleById(issue.id);
  const lineNo = issue.lineNo + 1;
  const base64Uri = Buffer.from(uri).toString('base64');

  return `
    <h1>${issue.description}</h1>

	<p>
	  <small>
	  Issue ID: <span class="issue-id" data-issue-id="${issue.id}">${issue.id}</span>
	  </small>
	</p>
	<p>
      <small>
        <a class="focus-line" data-line-no="${issue.lineNo}" data-uri="${base64Uri}" href="#">${filename}:${lineNo}</a>.
        Severity: ${criticality}.
	    ${scoreImpact}
	  </small>
    </p>

    ${article}`;
}

function getSummary(summary: Summary) {
  if (summary.all === 0 && summary.invalid) {
    return `
    <h1>Failed to perform security audit, the OpenAPI file is invalid or too large.</h1>
    <div>
    <small>
      Please submit your feedback for the security audit <a href="https://github.com/42Crunch/vscode-openapi/issues">here</a>
    </small>
    </div>
    <hr>`;
  }
  return `
    <h1>Security audit score: ${summary.all}</h1>
    <h3>Security (${summary.security.value}/${summary.security.max})</h3>
    <h3>Data validation (${summary.datavalidation.value}/${summary.datavalidation.max})</h3>
    <div>
    <small>
      Please submit your feedback for the security audit <a href="https://github.com/42Crunch/vscode-openapi/issues">here</a>
    </small>
    </div>
    <hr>
`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class ReportWebView {
  public static currentPanel: ReportWebView | undefined;

  readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  private currentAuditUri: string;

  public static readonly viewType = 'apisecurityReport';

  public static show(extensionPath: string, audit: Audit) {
    if (!ReportWebView.currentPanel) {
      ReportWebView.currentPanel = new ReportWebView(extensionPath);
    }

    ReportWebView.currentPanel.currentAuditUri = audit.summary.documentUri;
    ReportWebView.currentPanel._update(audit, ReportWebView.currentPanel._panel.webview);

    if (!ReportWebView.currentPanel._panel.visible) {
      ReportWebView.currentPanel._panel.reveal();
    }
  }

  public static showIds(extensionPath: string, audit: Audit, uri: string, ids: any[]) {
    if (!ReportWebView.currentPanel) {
      ReportWebView.currentPanel = new ReportWebView(extensionPath);
    }
    ReportWebView.currentPanel._updateIds(audit, ReportWebView.currentPanel._panel.webview, uri, ids);
    ReportWebView.currentPanel.currentAuditUri = null;
    if (!ReportWebView.currentPanel._panel.visible) {
      ReportWebView.currentPanel._panel.reveal();
    }
  }

  public static showIfVisible(audit: Audit) {
    if (
      ReportWebView.currentPanel &&
      ReportWebView.currentPanel._panel.visible &&
      ReportWebView.currentPanel.currentAuditUri != audit.summary.documentUri
    ) {
      // update only if showing different report to the current one
      ReportWebView.currentPanel.currentAuditUri = audit.summary.documentUri;
      ReportWebView.currentPanel._update(audit, ReportWebView.currentPanel._panel.webview);
    }
  }

  static showNoReport(context: vscode.ExtensionContext) {
    if (ReportWebView.currentPanel && ReportWebView.currentPanel._panel.visible) {
      ReportWebView.currentPanel.currentAuditUri = null;
      const webview = ReportWebView.currentPanel._panel.webview;

      const image = webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'resources', '42crunch_icon.png')),
      );

      webview.html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src 'unsafe-inline';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Contract Security Audit Report</title>
  </head>
  <body>
    <h1>No security audit report available for this file</h1>
    <p>Please click the <img src="${image}" style="width: 16px; height: 16px;"/>  button to run OpenAPI Security Audit</p>
  </body>
  </html>`;
    }
  }

  private constructor(extensionPath: string) {
    this._extensionPath = extensionPath;

    this._panel = vscode.window.createWebviewPanel(
      ReportWebView.viewType,
      'API Security Audit',
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      },
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, 'webview')),
          vscode.Uri.file(path.join(extensionPath, 'resources')),
        ],
      },
    );

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'copyIssueId':
            vscode.env.clipboard.writeText(message.id);
            const disposable = vscode.window.setStatusBarMessage(`Copied ID: ${message.id}`);
            setTimeout(() => disposable.dispose(), 1000);
            return;
          case 'goToLine':
            this.focusLine(Buffer.from(message.uri, 'base64').toString('utf8'), message.line);
            return;
          case 'goFullReport':
            vscode.commands.executeCommand(
              'openapi.focusSecurityAudit',
              Buffer.from(message.uri, 'base64').toString('utf8'),
            );
            return;
        }
      },
      null,
      this._disposables,
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private async focusLine(uri: string, line: string) {
    function focus(editor: vscode.TextEditor, lineNo: number) {
      const textLine = editor.document.lineAt(lineNo);
      editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
      editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
    }

    const lineNo = parseInt(line, 10);

    // check if document is already open
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.toString() == uri) {
        // document is already open
        focus(editor, lineNo);
        return;
      }
    }

    // if not already open, load and show it
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    focus(editor, lineNo);
  }

  public dispose() {
    ReportWebView.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update(audit: Audit, webview: vscode.Webview) {
    const scriptUrl = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionPath, 'webview', 'main.js')));
    const styleUrl = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionPath, 'webview', 'style.css')));
    const nonce = getNonce();

    const mainPath = vscode.Uri.parse(audit.summary.documentUri).fsPath;
    const mainDir = path.dirname(mainPath);

    const summaryHtml = getSummary(audit.summary);
    const issuesHtmlList = Object.entries(audit.issues)
      .map(([uri, issues]) => {
        const fsPath = vscode.Uri.parse(uri).fsPath;
        const filename = path.relative(mainDir, fsPath);
        return issues.map((issue) => getIssueHtml(uri, filename, issue));
      })
      .reduce((acc, val) => acc.concat(val), []);

    const issuesHtml = issuesHtmlList.length > 0 ? issuesHtmlList.join('\n') : `<h3>No issues found in this file</h3>`;

    this._panel.webview.html = getHtml(
      nonce,
      webview,
      styleUrl,
      scriptUrl,
      summaryHtml,
      issuesHtml,
      audit.summary.documentUri,
    );
  }

  private _updateIds(audit: Audit, webview: vscode.Webview, uri: string, ids: any[]) {
    const scriptUrl = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionPath, 'webview', 'main.js')));
    const styleUrl = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionPath, 'webview', 'style.css')));
    const nonce = getNonce();

    const mainPath = vscode.Uri.parse(audit.summary.documentUri).fsPath;
    const mainDir = path.dirname(mainPath);
    const filename = path.relative(mainDir, vscode.Uri.parse(uri).fsPath);

    const issues = ids.map((id) => audit.issues[uri][id]);

    const issuesHtml = issues.map((issue) => getIssueHtml(uri, filename, issue)).join('\n');

    this._panel.webview.html = getHtml(
      nonce,
      webview,
      styleUrl,
      scriptUrl,
      null,
      issuesHtml,
      audit.summary.documentUri,
    );
  }
}
