/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

import { audit, getArticles, requestToken } from "./client";
import { setDecorations, updateDecorations } from "./decoration";
import { updateDiagnostics } from "./diagnostic";

import { AuditReportWebView } from "./report";

import { AuditContext, Audit, PendingAudits } from "../types";

import { Cache } from "../cache";
import { stringify } from "@xliic/preserving-json-yaml-parser";
import { parseAuditReport, updateAuditContext } from "./audit";

export function registerSecurityAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditReportWebView
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
        reportWebView.prefetchKdb();
        const audit = await securityAudit(cache, textEditor);
        if (audit) {
          updateAuditContext(auditContext, uri, audit);
          updateDecorations(auditContext.decorations, audit.summary.documentUri, audit.issues);
          updateDiagnostics(auditContext.diagnostics, audit.filename, audit.issues);
          setDecorations(textEditor, auditContext);
          reportWebView.show(audit);
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
  auditContext: AuditContext,
  reportWebView: AuditReportWebView
) {
  return vscode.commands.registerCommand("openapi.focusSecurityAudit", async (documentUri) => {
    try {
      const audit = auditContext.auditsByMainDocument[documentUri];
      if (audit) {
        reportWebView.show(audit);
      }
    } catch (e) {
      vscode.window.showErrorMessage(`Unexpected error: ${e}`);
    }
  });
}

export function registerFocusSecurityAuditById(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  reportWebView: AuditReportWebView
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.focusSecurityAuditById",
    async (textEditor, edit, params) => {
      try {
        const documentUri = textEditor.document.uri.toString();
        const uri = Buffer.from(params.uri, "base64").toString("utf8");
        const audit = auditContext.auditsByMainDocument[uri];
        if (audit && audit.issues[documentUri]) {
          reportWebView.showIds(audit, documentUri, params.ids);
        }
      } catch (e) {
        vscode.window.showErrorMessage(`Unexpected error: ${e}`);
      }
    }
  );
}

async function securityAudit(
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
      const bundle = await cache.getDocumentBundle(textEditor.document);
      if (!bundle || "errors" in bundle) {
        vscode.commands.executeCommand("workbench.action.problems.focus");
        throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
      }
      try {
        const report = await audit(stringify(bundle.value), apiToken.trim(), progress);
        return parseAuditReport(cache, textEditor.document, report, bundle.mapping);
      } catch (e: any) {
        if (e?.response?.statusCode === 429) {
          vscode.window.showErrorMessage(
            "Too many requests. You can run up to 3 security audits per minute, please try again later."
          );
        } else if (e?.response?.statusCode === 403) {
          vscode.window.showErrorMessage(
            "Authentication failed. Please paste the token that you received in email to Preferences > Settings > Extensions > OpenAPI > Security Audit Token. If you want to receive a new token instead, clear that setting altogether and initiate a new security audit for one of your OpenAPI files."
          );
        } else {
          vscode.window.showErrorMessage("Unexpected error when trying to audit API: " + e);
        }
      }
    }
  );
}
