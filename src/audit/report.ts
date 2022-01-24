/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";
import { Cache } from "../cache";
import { fromInternalUri } from "../external-refs";
import { Audit, Summary } from "../types";

import { getLocationByPointer } from "./util";

const fallbackArticle = {
  description: {
    text: `<p>Whoops! Looks like there has been an oversight and we are missing a page for this issue.</p>
           <p><a href="https://apisecurity.io/contact-us/">Let us know</a> the title of the issue, and we make sure to add it to the encyclopedia.</p>`,
  },
};

function articleById(id: string, filename: string, articles: any) {
  const exampleLanguage =
    filename.toLowerCase().endsWith(".yaml") || filename.toLowerCase().endsWith("yml")
      ? "yaml"
      : "json";

  function partToText(part: any) {
    if (!part || !part.sections) {
      return "";
    }

    return part.sections
      .map((section: any) => {
        if (section.text) {
          return section.text;
        }
        if (section.code) {
          const code = section.code[exampleLanguage];
          return `<pre>${code}</pre>`;
        }
      })
      .join("");
  }

  //@ts-ignore
  const article = articles[id] || fallbackArticle;

  return [
    article ? article.description.text : "",
    partToText(article.example),
    partToText(article.exploit),
    partToText(article.remediation),
  ].join("");
}

function getHtml(
  webview: vscode.Webview,
  styleUrl: vscode.Uri,
  bootstrapUrl: vscode.Uri,
  scriptUrl: vscode.Uri,
  summary: string,
  issues: string,
  uri: string,
  extensionPath: string
): string {
  const logoUri =
    vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.Light
      ? vscode.Uri.file(path.join(extensionPath, "resources", "light", "logo.svg"))
      : vscode.Uri.file(path.join(extensionPath, "resources", "dark", "logo.svg"));
  const logo = webview.asWebviewUri(logoUri);
  const base64Uri = Buffer.from(uri).toString("base64");
  const backToReport = summary
    ? ""
    : `<h4><a class="go-full-report" data-uri="${base64Uri}" href="#">Go back to full report</a></h4>`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
        webview.cspSource
      }; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline' ${
    webview.cspSource
  };">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Contract Security Audit Report</title>
      <link rel="stylesheet" href="${bootstrapUrl}">
      <link rel="stylesheet" href="${styleUrl}">
  </head>
  <body>
      <script src="${scriptUrl}"></script>

      <div class="c_header">
      <div class="d-flex justify-content-between">
        <div>
          <span class="font-weight-bold">Powered by</span>
          <span
            ><a href="https://www.42crunch.com"><img valign="middle" src="${logo}" alt="" /></a
          ></span>
        </div>
        <div>
          <div class="dropdown">
            <button class="dropbtn">Learn More</button>
            <div class="dropdown-content">
              <a href="https://42crunch.com/api-security-audit/">API Contract Security Audit</a>
              <a href="https://42crunch.com/api-conformance-scan/">API Contract Conformance Scan</a>
              <a href="https://42crunch.com/micro-api-firewall-protection/">API Protection</a>
            </div>
          </div>
        </div>
      </div>
      </div>

      ${summary || ""}
      ${issues || ""}
      ${backToReport}

      <div class="c_footer">
      <div class="d-flex justify-content-between">
        <div>
          <span class="font-weight-bold">Powered by</span>
          <span
            ><a href="https://www.42crunch.com"><img valign="middle" src="${logo}" alt="" /></a
          ></span>
        </div>
        <div>
          <div class="dropdown">
            <button class="dropbtn">Learn More</button>
            <div class="dropdown-content">
              <a href="https://42crunch.com/api-security-audit/">API Contract Security Audit</a>
              <a href="https://42crunch.com/api-conformance-scan/">API Contract Conformance Scan</a>
              <a href="https://42crunch.com/micro-api-firewall-protection/">API Protection</a>
            </div>
          </div>
        </div>
      </div>
      </div>
  </body>
  </html>`;
}

function getIssueHtml(uri: string, filename: string, issue: any, articles: any) {
  const criticalityNames = {
    5: "Critical",
    4: "High",
    3: "Medium",
    2: "Low",
    1: "Info",
  };

  // @ts-ignore
  const criticality = criticalityNames[issue.criticality];
  const scoreImpact = issue.displayScore !== "0" ? `Score impact: ${issue.displayScore}` : "";
  const article = articleById(issue.id, filename, articles);
  const lineNo = issue.lineNo + 1;
  const base64Uri = Buffer.from(uri).toString("base64");

  return `
  <div class="c_roundedbox_section">
    <h1>${issue.description}</h1>

	<p>
	  <small>
	  Issue ID: <span class="issue-id" data-issue-id="${issue.id}">${issue.id}</span>
	  </small>
	</p>
	<p>
      <small>
        <a class="focus-line" data-line-no="${issue.lineNo}" data-line-pointer="${issue.pointer}" data-uri="${base64Uri}" href="#">${filename}:${lineNo}</a>.
        Severity: ${criticality}.
	    ${scoreImpact}
	  </small>
    </p>

    ${article}
  </div>`;
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
  <div class="c_roundedbox">  
    <h1>Security audit score: <span>${summary.all}&nbsp;/&nbsp;100</span></h1>
    <div class="progress-bar-holder">
      <div class="progress-bar bar-red" style="width: ${summary.all}%"></div>
    </div>
    <h3>Security: <span>${summary.security.value} / ${summary.security.max}</span></h3>
    <h3>Data validation: <span>${summary.datavalidation.value} / ${summary.datavalidation.max}</span></h3>
    <div>
      <small>
        Please submit your feedback for the security audit <a href="https://github.com/42Crunch/vscode-openapi/issues" title="https://github.com/42Crunch/vscode-openapi/issues">here</a>
      </small>
    </div>
  </div>
`;
}

export class ReportWebView {
  public static currentPanel: ReportWebView | undefined;
  public static cache: Cache;

  readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  private currentAuditUri?: string;
  private articles: any;

  public static readonly viewType = "apisecurityReport";

  public static show(extensionPath: string, articles: any, audit: Audit, cache: Cache) {
    ReportWebView.cache = cache;

    if (!ReportWebView.currentPanel) {
      ReportWebView.currentPanel = new ReportWebView(extensionPath, articles);
    }

    ReportWebView.currentPanel.currentAuditUri = audit.summary.documentUri;
    ReportWebView.currentPanel._update(audit, ReportWebView.currentPanel._panel.webview);

    if (!ReportWebView.currentPanel._panel.visible) {
      ReportWebView.currentPanel._panel.reveal();
    }
  }

  public static showIds(
    extensionPath: string,
    articles: any,
    audit: Audit,
    uri: string,
    ids: any[]
  ) {
    if (!ReportWebView.currentPanel) {
      ReportWebView.currentPanel = new ReportWebView(extensionPath, articles);
    }
    ReportWebView.currentPanel._updateIds(
      articles,
      audit,
      ReportWebView.currentPanel._panel.webview,
      uri,
      ids
    );
    ReportWebView.currentPanel.currentAuditUri = undefined;
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
      ReportWebView.currentPanel.currentAuditUri = undefined;
      const webview = ReportWebView.currentPanel._panel.webview;

      const image = webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, "resources", "42crunch_icon.svg"))
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

  private constructor(extensionPath: string, articles: any) {
    this._extensionPath = extensionPath;
    this.articles = articles;

    this._panel = vscode.window.createWebviewPanel(
      ReportWebView.viewType,
      "API Security Audit",
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      },
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, "webview")),
          vscode.Uri.file(path.join(extensionPath, "resources")),
        ],
      }
    );

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "copyIssueId":
            vscode.env.clipboard.writeText(message.id);
            const disposable = vscode.window.setStatusBarMessage(`Copied ID: ${message.id}`);
            setTimeout(() => disposable.dispose(), 1000);
            return;
          case "goToLine":
            this.focusLine(
              Buffer.from(message.uri, "base64").toString("utf8"),
              message.pointer,
              message.line
            );
            return;
          case "goFullReport":
            vscode.commands.executeCommand(
              "openapi.focusSecurityAudit",
              Buffer.from(message.uri, "base64").toString("utf8")
            );
            return;
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
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

    const root = ReportWebView.cache.getParsedDocument(editor.document);
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
    const scriptUrl = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionPath, "webview", "main.js"))
    );
    const styleUrl = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionPath, "webview", "style.css"))
    );
    const bootstrapUrl = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionPath, "webview", "bootstrap.min.css"))
    );

    const mainPath = vscode.Uri.parse(audit.summary.documentUri).fsPath;
    const mainDir = path.dirname(mainPath);

    const summaryHtml = getSummary(audit.summary);
    const issuesHtmlList = Object.entries(audit.issues)
      .map(([uri, issues]) => {
        const publicUri = fromInternalUri(vscode.Uri.parse(uri));
        if (publicUri.scheme === "http" || publicUri.scheme === "https") {
          return issues.map((issue) =>
            getIssueHtml(uri, publicUri.toString(), issue, this.articles)
          );
        }
        const filename = path.relative(mainDir, publicUri.fsPath);
        return issues.map((issue) => getIssueHtml(uri, filename, issue, this.articles));
      })
      .reduce((acc, val) => acc.concat(val), []);

    const issuesHtml =
      issuesHtmlList.length > 0
        ? issuesHtmlList.join("\n")
        : `<h3>No issues found in this file</h3>`;

    this._panel.webview.html = getHtml(
      webview,
      styleUrl,
      bootstrapUrl,
      scriptUrl,
      summaryHtml,
      issuesHtml,
      audit.summary.documentUri,
      this._extensionPath
    );
  }

  private _updateIds(
    articles: any,
    audit: Audit,
    webview: vscode.Webview,
    uri: string,
    ids: any[]
  ) {
    const scriptUrl = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionPath, "webview", "main.js"))
    );
    const styleUrl = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionPath, "webview", "style.css"))
    );
    const bootstrapUrl = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionPath, "webview", "bootstrap.min.css"))
    );

    const mainPath = vscode.Uri.parse(audit.summary.documentUri).fsPath;
    const mainDir = path.dirname(mainPath);
    const filename = path.relative(mainDir, vscode.Uri.parse(uri).fsPath);

    const issues = ids.map((id) => audit.issues[uri][id]);

    const issuesHtml = issues
      .map((issue) => getIssueHtml(uri, filename, issue, articles))
      .join("\n");

    this._panel.webview.html = getHtml(
      webview,
      styleUrl,
      bootstrapUrl,
      scriptUrl,
      "",
      issuesHtml,
      audit.summary.documentUri,
      this._extensionPath
    );
  }
}
