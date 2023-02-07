/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

import { audit } from "./client";
import { setDecorations, updateDecorations } from "./decoration";
import { updateDiagnostics } from "./diagnostic";

import { AuditReportWebView } from "./report";

import { AuditContext, Audit, PendingAudits, BundleResult, Bundle } from "../types";

import { Cache } from "../cache";
import { stringify } from "@xliic/preserving-json-yaml-parser";
import { parseAuditReport, updateAuditContext } from "./audit";
import { configureCredentials, getPlatformCredentials, hasCredentials } from "../credentials";
import { PlatformStore } from "../platform/stores/platform-store";
import { Configuration, configuration } from "../configuration";

export function registerSecurityAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditReportWebView,
  store: PlatformStore
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityAudit",
    async (textEditor: vscode.TextEditor, edit) => {
      const credentials = await hasCredentials(configuration, context.secrets);
      if (credentials === undefined) {
        // try asking for credentials if not found
        const configured = await configureCredentials(configuration, context.secrets);
        if (configured === "platform") {
          // update platform connection if platform credentials have been provided
          store.setCredentials(await getPlatformCredentials(configuration, context.secrets));
        } else if (configured === undefined) {
          // or don't do audit if no credentials been supplied
          return;
        }
      }

      const uri = textEditor.document.uri.toString();

      if (pendingAudits[uri]) {
        vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
        return;
      }

      delete auditContext.auditsByMainDocument[uri];
      pendingAudits[uri] = true;

      try {
        reportWebView.prefetchKdb();
        const audit = await securityAudit(cache, configuration, context.secrets, store, textEditor);
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
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  textEditor: vscode.TextEditor
): Promise<Audit | undefined> {
  const proceed = await vscode.commands.executeCommand(
    "openapi.platform.dataDictionaryPreAuditBulkUpdateProperties",
    textEditor.document.uri
  );

  if (!proceed) {
    return;
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

      const credentials = await hasCredentials(configuration, secrets);
      // prefer anond credentials for now
      if (credentials === "anond") {
        return runAnondAudit(textEditor.document, bundle, cache, configuration, progress);
      } else if (credentials === "platform") {
        return runPlatformAudit(textEditor.document, bundle, cache, store);
      }
    }
  );
}

async function runAnondAudit(
  document: vscode.TextDocument,
  bundle: Bundle,
  cache: Cache,
  configuration: Configuration,
  progress: vscode.Progress<any>
): Promise<Audit | undefined> {
  const apiToken = <string>configuration.get("securityAuditToken");
  try {
    const report = await audit(stringify(bundle.value), apiToken.trim(), progress);
    return parseAuditReport(cache, document, report, bundle.mapping);
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

async function runPlatformAudit(
  document: vscode.TextDocument,
  bundle: Bundle,
  cache: Cache,
  store: PlatformStore
): Promise<Audit | undefined> {
  try {
    const api = await store.createTempApi(stringify(bundle.value));
    const report = await store.getAuditReport(api.desc.id);
    await store.deleteApi(api.desc.id);
    return parseAuditReport(cache, document, report, bundle.mapping);
  } catch (ex: any) {
    if (
      ex?.response?.statusCode === 409 &&
      ex?.response?.body?.code === 109 &&
      ex?.response?.body?.message === "limit reached"
    ) {
      vscode.window.showErrorMessage(
        "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
      );
    } else {
      vscode.window.showErrorMessage(
        `Unexpected error when trying to audit API using the platform: ${ex} ${
          ex?.response?.body ? JSON.stringify(ex.response.body) : ""
        }`
      );
    }
  }
}
