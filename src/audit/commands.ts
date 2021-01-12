/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import { basename } from "path";
import * as vscode from "vscode";

import { audit, requestToken } from "./client";
import { createDecorations, setDecorations } from "./decoration";
import { createDiagnostics } from "./diagnostic";

import { ReportWebView } from "./report";
import { TextDocument } from "vscode";
import { findMapping } from "../bundler";
import { Node } from "../ast";
import { RuntimeContext } from "../types";
import {
  AuditContext,
  Audit,
  Grades,
  Issue,
  ReportedIssue,
  IssuesByDocument,
  IssuesByType,
} from "./types";
import { parserOptions } from "../parser-options";
import { Cache } from "../cache";

export function registerSecurityAudit(
  context: vscode.ExtensionContext,
  runtimeContext: RuntimeContext,
  auditContext: AuditContext,
  pendingAudits
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityAudit",
    async (textEditor, edit) => {
      const uri = textEditor.document.uri.toString();

      if (pendingAudits[uri]) {
        vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
        return;
      }

      const existingAudit = auditContext[uri];
      if (existingAudit) {
        existingAudit.diagnostics.dispose();
      }
      delete auditContext[uri];
      pendingAudits[uri] = true;

      try {
        const audit = await securityAudit(context, runtimeContext, textEditor);
        if (audit) {
          auditContext[uri] = audit;
          setDecorations(textEditor, auditContext);
        }
        delete pendingAudits[uri];
      } catch (e) {
        delete pendingAudits[uri];
        vscode.window.showErrorMessage(`Failed to audit: ${e}`);
      }
    }
  );
}

export function registerFocusSecurityAudit(context, auditContext) {
  return vscode.commands.registerCommand("openapi.focusSecurityAudit", (documentUri) => {
    const audit = auditContext[documentUri];
    if (audit) {
      ReportWebView.show(context.extensiontPath, audit);
    }
  });
}

export function registerFocusSecurityAuditById(context, auditContext) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.focusSecurityAuditById",
    (textEditor, edit, params) => {
      const documentUri = textEditor.document.uri.toString();
      const uri = Buffer.from(params.uri, "base64").toString("utf8");
      const audit = auditContext[uri];
      if (audit && audit.issues[documentUri]) {
        ReportWebView.showIds(context.extensionPath, audit, documentUri, params.ids);
      }
    }
  );
}

async function securityAudit(
  context: vscode.ExtensionContext,
  runtimeContext: RuntimeContext,
  textEditor: vscode.TextEditor
): Promise<Audit | undefined> {
  const configuration = vscode.workspace.getConfiguration("openapi");
  let apiToken = <string>configuration.get("securityAuditToken");

  if (!apiToken) {
    const email = await vscode.window.showInputBox({
      prompt:
        "Security Audit from 42Crunch runs ~200 checks for security best practices in your API. VS Code needs an API key to use the service. Enter your email to receive the token.",
      placeHolder: "email address",
      validateInput: (value) =>
        value.indexOf("@") > 0 && value.indexOf("@") < value.length - 1
          ? null
          : "Please enter valid email address",
    });

    if (!email) {
      return;
    }

    const tokenRequestResult = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Requesting token" },
      async (progress, token) => {
        try {
          return await requestToken(email);
        } catch (e) {
          vscode.window.showErrorMessage("Unexpected error when trying to request token: " + e);
        }
      }
    );

    if (!tokenRequestResult || tokenRequestResult.status !== "success") {
      return;
    }

    const token = await vscode.window.showInputBox({
      prompt:
        "API token has been sent. If you don't get the mail within a couple minutes, check your spam folder and that the address is correct. Paste the token above.",
      ignoreFocusOut: true,
      placeHolder: "token",
    });

    if (!token) {
      return;
    }

    const configuration = vscode.workspace.getConfiguration();
    configuration.update("openapi.securityAuditToken", token, vscode.ConfigurationTarget.Global);
    apiToken = token;
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running API Contract Security Audit...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<Audit | undefined> => {
      return performAudit(context, runtimeContext, textEditor, apiToken, progress);
    }
  );
}

async function performAudit(
  context: vscode.ExtensionContext,
  runtimeContext: RuntimeContext,
  textEditor: vscode.TextEditor,
  apiToken,
  progress
): Promise<Audit | undefined> {
  const entry = await runtimeContext.cache.getEntryForDocument(textEditor.document);
  if (!entry.bundled || entry.bundledErorrs) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
  }

  try {
    const documentUri = textEditor.document.uri.toString();
    const [grades, issuesByDocument, documents] = await auditDocument(
      textEditor.document,
      JSON.stringify(entry.bundled),
      runtimeContext.cache,
      entry.bundledMapping,
      apiToken,
      progress
    );

    const issuesByType: IssuesByType = {};

    for (const issues of Object.values(issuesByDocument)) {
      for (const issue of issues) {
        if (!issuesByType[issue.id]) {
          issuesByType[issue.id] = [];
        }
        issuesByType[issue.id].push(issue);
      }
    }

    const filename = basename(textEditor.document.fileName);
    const diagnostics = createDiagnostics(filename, issuesByDocument, textEditor);
    const decorations = createDecorations(documentUri, issuesByDocument);

    const audit = {
      summary: {
        ...grades,
        documentUri,
        subdocumentUris: Object.keys(documents).filter((uri) => uri != documentUri),
      },
      issues: issuesByDocument,
      issuesByType,
      filename,
      diagnostics,
      decorations,
    };

    ReportWebView.show(context.extensionPath, audit);

    return audit;
  } catch (e) {
    if (e.statusCode && e.statusCode === 429) {
      vscode.window.showErrorMessage(
        "Too many requests. You can run up to 3 security audits per minute, please try again later."
      );
    } else if (e.statusCode && e.statusCode === 403) {
      vscode.window.showErrorMessage(
        "Authentication failed. Please paste the token that you received in email to Preferences > Settings > Extensions > OpenAPI > Security Audit Token. If you want to receive a new token instead, clear that setting altogether and initiate a new security audit for one of your OpenAPI files."
      );
    } else {
      vscode.window.showErrorMessage("Unexpected error when trying to audit API: " + e);
    }
  }
}

function findIssueLocation(mainUri: vscode.Uri, root: Node, mappings, pointer): [string, string] {
  const node = root.find(pointer);
  if (node) {
    return [mainUri.toString(), pointer];
  } else {
    const mapping = findMapping(mappings, pointer);
    if (mapping) {
      const uri = mainUri.with({ path: mapping.file });
      return [uri.toString(), mapping.hash];
    }
  }
  throw new Error(`Cannot find entry for pointer: ${pointer}`);
}

async function processIssues(
  document,
  cache: Cache,
  mappings,
  issues: ReportedIssue[]
): Promise<[Node, string[], { [uri: string]: ReportedIssue[] }]> {
  const mainUri = document.uri;
  const documentUris: { [uri: string]: boolean } = { [mainUri.toString()]: true };
  const issuesPerDocument: { [uri: string]: ReportedIssue[] } = {};

  const { astRoot: root } = await cache.getEntryForDocument(document);

  for (const issue of issues) {
    const [uri, pointer] = findIssueLocation(mainUri, root, mappings, issue.pointer);

    if (!issuesPerDocument[uri]) {
      issuesPerDocument[uri] = [];
    }

    if (!documentUris[uri]) {
      documentUris[uri] = true;
    }

    issuesPerDocument[uri].push({
      ...issue,
      pointer: pointer,
    });
  }

  return [root, Object.keys(documentUris), issuesPerDocument];
}

async function auditDocument(
  mainDocument: TextDocument,
  json: string,
  cache: Cache,
  mappings,
  apiToken,
  progress
): Promise<[Grades, IssuesByDocument, { [uri: string]: TextDocument }]> {
  const [grades, reportedIssues] = await audit(json, apiToken.trim(), progress);
  const [mainRoot, documentUris, issuesPerDocument] = await processIssues(
    mainDocument,
    cache,
    mappings,
    reportedIssues
  );

  const files: { [uri: string]: [TextDocument, Node] } = {
    [mainDocument.uri.toString()]: [mainDocument, mainRoot],
  };

  const markerNode = mainRoot.find("/openapi") || mainRoot.find("/swagger");

  // load and parse all documents
  for (const uri of documentUris) {
    if (!files[uri]) {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
      const { astRoot } = await cache.getEntryForDocument(document);
      files[uri] = [document, astRoot];
    }
  }

  const issues: IssuesByDocument = {};

  for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
    const [document, root] = files[uri];
    issues[uri] = reportedIssues.map(
      (issue: ReportedIssue): Issue => {
        // '' applies only to the main document
        const node = issue.pointer === "" ? markerNode : root.find(issue.pointer);
        if (node) {
          const [start, end] = node.getRange();
          const position = document.positionAt(start);
          const line = document.lineAt(position.line);
          return {
            ...issue,
            documentUri: uri,
            lineNo: position.line,
            range: new vscode.Range(
              new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
              new vscode.Position(position.line, line.range.end.character)
            ),
          };
        } else {
          throw new Error(`Unable to locate node: ${issue.pointer}`);
        }
      }
    );
  }

  const documents = {};
  for (const [uri, [document, root]] of Object.entries(files)) {
    documents[uri] = document;
  }

  return [grades, issues, documents];
}
