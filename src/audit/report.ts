/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from 'path';
import * as vscode from 'vscode';
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
    return part.sections.map(section => `${section.text || ''}${section.code || ''}`).join('');
  }

  const article = articles[id] || fallbackArticle;

  return [
    article ? article.description.text : '',
    partToText(article.example),
    partToText(article.exploit),
    partToText(article.remediation),
  ].join('');
}

function getHtml(nonce: string, styleUrl: vscode.Uri, scriptUrl: vscode.Uri, summary: string, issues: string): string {
  const backToReport = summary ? '' : `<h4><a class="go-full-report" href="#">Go back to full report</a></h4>`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; style-src vscode-resource: https:; script-src 'nonce-${nonce}';">
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

function getIssueHtml(issue) {
  const criticalityNames = {
    5: 'Critical',
    4: 'High',
    3: 'Medium',
    2: 'Low',
    1: 'Info',
  };

  const criticality = criticalityNames[issue.criticality];
  const scoreImpact = issue.displayScore !== '0' ? `Score impact ${issue.displayScore}` : '';
  const article = articleById(issue.id);

  return `
    <h1>${issue.description}</h1>
    <small>
      <a class="focus-line" data-line-no="${issue.lineNo}" href="#">${issue.loc}</a>.
      Severity: ${criticality}.
      ${scoreImpact}
    </small>
    ${article}`;
}

function getSummaryHtml(summary) {
  if (!summary) {
    return '';
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
  private documentUri: any;

  public static readonly viewType = 'apisecurityReport';

  public static createOrShow(extensionPath: string, issues: any, summary: any, documentUri: string) {
    if (ReportWebView.currentPanel) {
      ReportWebView.currentPanel._update(issues, summary, documentUri);
      if (!ReportWebView.currentPanel._panel.visible) {
        ReportWebView.currentPanel._panel.reveal();
      }
    } else {
      ReportWebView.currentPanel = new ReportWebView(extensionPath, issues, summary, documentUri);
    }
  }

  public static updateIfVisible(issues: any, summary: any, documentUri: string) {
    if (ReportWebView.currentPanel && ReportWebView.currentPanel._panel.visible) {
      ReportWebView.currentPanel._update(issues, summary, documentUri);
    }
  }

  public static displayNoReport(context: vscode.ExtensionContext) {
    if (ReportWebView.currentPanel && ReportWebView.currentPanel._panel.visible) {
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
    <p>Please click <img src="${image}" style="width: 16px; height: 16px;"/>  button to run OpenAPI Security Audit</p>
  </body>
  </html>`;
    }
  }

  private constructor(extensionPath: string, issues: any, summary: any, documentUri: string) {
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
      message => {
        switch (message.command) {
          case 'goToLine':
            this.focusLine(message.line);
            return;
          case 'goFullReport':
            vscode.commands.executeCommand('openapi.focusSecurityAudit', documentUri);
            return;
        }
      },
      null,
      this._disposables,
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._update(issues, summary, documentUri);
  }

  private async focusLine(line: string) {
    function focus(editor: vscode.TextEditor, lineNo: number) {
      const textLine = editor.document.lineAt(lineNo);
      editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
      editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
    }

    const lineNo = parseInt(line, 10);

    // check if document is already open
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.toString() == this.documentUri) {
        // document is already open
        focus(editor, lineNo);
        return;
      }
    }

    // if not already open, load and show it
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(this.documentUri));
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

  private _update(issues, summary, documentUri: string) {
    this.documentUri = documentUri;
    this._panel.webview.html = this.getWebviewContent(issues, summary);
  }

  private getWebviewContent(issues, summary) {
    const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'webview', 'main.js'));
    const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'webview', 'style.css'));
    const scriptUrl = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
    const styleUrl = stylePathOnDisk.with({ scheme: 'vscode-resource' });
    const nonce = getNonce();
    const summaryHtml = getSummaryHtml(summary);
    const issuesHtml = issues.map(issue => getIssueHtml(issue)).join('');

    return getHtml(nonce, styleUrl, scriptUrl, summaryHtml, issuesHtml);
  }
}
