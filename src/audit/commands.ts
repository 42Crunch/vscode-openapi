/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import { basename } from "path";
import * as vscode from "vscode";

import { audit, requestToken } from "./client";
import { setDecorations, updateDecorations } from "./decoration";
import { updateDiagnostics } from "./diagnostic";

import { ReportWebView } from "./report";
import { TextDocument } from "vscode";
import { findMapping } from "../bundler";
import { Node } from "@xliic/openapi-ast-node";
import { AuditContext, Audit, Grades, Issue, ReportedIssue, IssuesByDocument } from "../types";

import { Cache } from "../cache";
import { getLocationByPointer } from "./util";
import { stringify } from '@xliic/preserving-json-yaml-parser';

export function registerSecurityAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityAudit",
    async (textEditor: vscode.TextEditor, edit) => {
      const uri = textEditor.document.uri.toString();

      if (pendingAudits[uri]) {
        vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
        return;
      }

      delete auditContext.auditsByMainDocument[uri];
      pendingAudits[uri] = true;

      try {
        const audit = await securityAudit(context, auditContext, cache, textEditor);
        if (audit) {
          auditContext.auditsByMainDocument[uri] = audit;

          const auditsBySubDocument = {
            [audit.summary.documentUri]: audit,
          };

          for (const uri of audit.summary.subdocumentUris) {
            auditsBySubDocument[uri] = audit;
          }

          auditContext.auditsByDocument = {
            ...auditContext.auditsByDocument,
            ...auditsBySubDocument,
          };

          updateDecorations(auditContext.decorations, audit.summary.documentUri, audit.issues);
          updateDiagnostics(auditContext.diagnostics, audit.filename, audit.issues, textEditor);
          setDecorations(textEditor, auditContext);

          ReportWebView.show(context.extensionPath, audit, cache);
        }
        delete pendingAudits[uri];
      } catch (e) {
        delete pendingAudits[uri];
        vscode.window.showErrorMessage(`Failed to audit: ${e}`);
      }
    }
  );
}

export function registerFocusSecurityAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext
) {
  return vscode.commands.registerCommand("openapi.focusSecurityAudit", (documentUri) => {
    const audit = auditContext.auditsByMainDocument[documentUri];
    if (audit) {
      ReportWebView.show(context.extensionPath, audit, cache);
    }
  });
}

export function registerFocusSecurityAuditById(
  context: vscode.ExtensionContext,
  auditContext: AuditContext
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.focusSecurityAuditById",
    (textEditor, edit, params) => {
      const documentUri = textEditor.document.uri.toString();
      const uri = Buffer.from(params.uri, "base64").toString("utf8");
      const audit = auditContext.auditsByMainDocument[uri];
      if (audit && audit.issues[documentUri]) {
        ReportWebView.showIds(context.extensionPath, audit, documentUri, params.ids);
      }
    }
  );
}

async function securityAudit(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
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
      return performAudit(context, auditContext, cache, textEditor, apiToken, progress);
    }
  );
}

async function performAudit(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  textEditor: vscode.TextEditor,
  apiToken,
  progress
): Promise<Audit | undefined> {
  const bundle = await cache.getDocumentBundle(textEditor.document);
  if (!bundle || "errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
  }

  try {
    const documentUri = textEditor.document.uri.toString();

    const [grades, issues, documents, badIssues] = await auditDocument(
      textEditor.document,
      stringify(bundle.value),
      cache,
      bundle.mapping,
      apiToken,
      progress
    );

    if (badIssues.length > 0) {
      const messages = badIssues.map(
        (issue: ReportedIssue) => `Unable to locate issue "${issue.id}" at "${issue.pointer}".`
      );
      messages.unshift(
        "Some issues have not been displayed, please contact support at https://support.42crunch.com with the following information:"
      );
      vscode.window.showErrorMessage(messages.join(" "));
    }

    const filename = basename(textEditor.document.fileName);

    const audit = {
      summary: {
        ...grades,
        documentUri,
        subdocumentUris: Object.keys(documents).filter((uri) => uri != documentUri),
      },
      issues,
      filename,
    };

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

function findIssueLocation(
  mainUri: vscode.Uri,
  root: Node,
  mappings,
  pointer
): [string, string] | undefined {
  const node = root.find(pointer);
  if (node) {
    return [mainUri.toString(), pointer];
  } else {
    const mapping = findMapping(mappings, pointer);
    if (mapping.hash) {
      return [mapping.uri, mapping.hash];
    }
  }
}

async function processIssues(
  document: vscode.TextDocument,
  cache: Cache,
  mappings,
  issues: ReportedIssue[]
): Promise<[Node, string[], { [uri: string]: ReportedIssue[] }, ReportedIssue[]]> {
  const mainUri = document.uri;
  const documentUris: { [uri: string]: boolean } = { [mainUri.toString()]: true };
  const issuesPerDocument: { [uri: string]: ReportedIssue[] } = {};
  const badIssues: ReportedIssue[] = [];

  const root = cache.getLastGoodDocumentAst(document);

  for (const issue of issues) {
    const location = findIssueLocation(mainUri, root, mappings, issue.pointer);
    if (location) {
      const [uri, pointer] = location;

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
    } else {
      // can't find issue, add to the list ot bad issues
      badIssues.push(issue);
    }
  }

  return [root, Object.keys(documentUris), issuesPerDocument, badIssues];
}

async function auditDocument(
  mainDocument: TextDocument,
  json: string,
  cache: Cache,
  mappings,
  apiToken,
  progress
): Promise<[Grades, IssuesByDocument, { [uri: string]: TextDocument }, ReportedIssue[]]> {
  const [grades, reportedIssues] = await audit(json, apiToken.trim(), progress);
  const [mainRoot, documentUris, issuesPerDocument, badIssues] = await processIssues(
    mainDocument,
    cache,
    mappings,
    reportedIssues
  );

  const files: { [uri: string]: [TextDocument, Node] } = {
    [mainDocument.uri.toString()]: [mainDocument, mainRoot],
  };

  // load and parse all documents
  for (const uri of documentUris) {
    if (!files[uri]) {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
      const root = cache.getLastGoodDocumentAst(document);
      files[uri] = [document, root];
    }
  }

  const issues: IssuesByDocument = {};
  for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
    const [document, root] = files[uri];
    issues[uri] = reportedIssues.map(
      (issue: ReportedIssue): Issue => {
        const [lineNo, range] = getLocationByPointer(document, root, issue.pointer);
        return {
          ...issue,
          documentUri: uri,
          lineNo,
          range,
        };
      }
    );
  }

  const documents = {};
  for (const [uri, [document, root]] of Object.entries(files)) {
    documents[uri] = document;
  }

  return [grades, issues, documents, badIssues];
}
