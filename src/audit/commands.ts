/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

import { HttpMethod } from "@xliic/common/http";
import { Audit } from "@xliic/common/audit";

import { audit } from "./client";
import { setDecorations } from "./decoration";

import { AuditWebView } from "./view";

import { AuditContext, PendingAudits, MappingNode } from "../types";

import { Cache } from "../cache";
import { stringify } from "@xliic/preserving-json-yaml-parser";
import { parseAuditReport, updateAuditContext } from "./audit";
import { configureCredentials, getPlatformCredentials, hasCredentials } from "../credentials";
import { PlatformStore } from "../platform/stores/platform-store";
import { Configuration, configuration } from "../configuration";
import { setAudit } from "./service";
import { extractSingleOperation } from "../util/extract";

export function registerSecurityAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityAudit",
    async (textEditor: vscode.TextEditor, edit) => {
      const credentials = await hasCredentials(configuration, context.secrets);
      if (credentials === undefined) {
        // try asking for credentials if not found
        const configured = await configureCredentials(configuration, context.secrets);
        if (configured === undefined) {
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
        await reportWebView.show();
        await reportWebView.sendColorTheme(vscode.window.activeColorTheme);
        reportWebView.prefetchKdb();
        await reportWebView.sendStartAudit();
        const audit = await securityAudit(cache, configuration, context.secrets, store, textEditor);
        if (audit) {
          setAudit(auditContext, uri, audit);
          setDecorations(textEditor, auditContext);
          await reportWebView.showReport(audit);
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
  reportWebView: AuditWebView
) {
  return vscode.commands.registerCommand("openapi.focusSecurityAudit", async (documentUri) => {
    try {
      const audit = auditContext.auditsByMainDocument[documentUri];
      if (audit) {
        reportWebView.showReport(audit);
      }
    } catch (e) {
      vscode.window.showErrorMessage(`Unexpected error: ${e}`);
    }
  });
}

export function registerFocusSecurityAuditById(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  reportWebView: AuditWebView
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
      const bundle = await cache.getDocumentBundle(textEditor.document, { rebundle: true });
      if (!bundle || "errors" in bundle) {
        vscode.commands.executeCommand("workbench.action.problems.focus");
        throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
      }

      const credentials = await hasCredentials(configuration, secrets);
      const oas = stringify(bundle.value);
      // prefer anond credentials for now
      if (credentials === "anond") {
        return runAnondAudit(
          textEditor.document,
          oas,
          bundle.mapping,
          cache,
          configuration,
          progress
        );
      } else if (credentials === "platform") {
        return runPlatformAudit(textEditor.document, oas, bundle.mapping, cache, store);
      }
    }
  );
}

async function runAnondAudit(
  document: vscode.TextDocument,
  oas: string,
  mapping: MappingNode,
  cache: Cache,
  configuration: Configuration,
  progress: vscode.Progress<any>
): Promise<Audit | undefined> {
  const apiToken = <string>configuration.get("securityAuditToken");
  try {
    const report = await audit(oas, apiToken.trim(), progress);
    return parseAuditReport(cache, document, report, mapping);
  } catch (e: any) {
    if (e?.response?.statusCode === 429) {
      vscode.window.showErrorMessage(
        "Too many requests. You can run up to 3 security audits per minute, please try again later."
      );
    } else if (e?.response?.statusCode === 403) {
      if (e?.response?.body?.includes("request validation")) {
        vscode.window.showErrorMessage(
          "Failed to submit OpenAPI for security audit. Please check if your file is less than 2Mb in size"
        );
      } else {
        vscode.window.showErrorMessage(
          "Authentication failed. Please paste the token that you received in email to Preferences > Settings > Extensions > OpenAPI > Security Audit Token. If you want to receive a new token instead, clear that setting altogether and initiate a new security audit for one of your OpenAPI files."
        );
      }
    } else {
      vscode.window.showErrorMessage("Unexpected error when trying to audit API: " + e);
    }
  }
}

async function runPlatformAudit(
  document: vscode.TextDocument,
  oas: string,
  mapping: MappingNode,
  cache: Cache,
  store: PlatformStore
): Promise<Audit | undefined> {
  try {
    const tmpApi = await store.createTempApi(oas);
    const report = await store.getAuditReport(tmpApi.apiId);
    const compliance = await store.readAuditCompliance(report.tid);
    const todoReport = await store.readAuditReportSqgTodo(report.tid);
    await store.clearTempApi(tmpApi);
    const audit = await parseAuditReport(cache, document, report.data, mapping);
    const { issues: todo } = await parseAuditReport(cache, document, todoReport.data, mapping);
    audit.compliance = compliance;
    audit.todo = todo;
    return audit;
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

async function singleOperationSecurityAudit(
  path: string,
  method: HttpMethod,
  cache: Cache,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  editor: vscode.TextEditor
): Promise<Audit | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running API Contract Security Audit...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<Audit | undefined> => {
      const bundle = await cache.getDocumentBundle(editor.document);

      if (!bundle || "errors" in bundle) {
        vscode.commands.executeCommand("workbench.action.problems.focus");
        throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
      }

      const credentials = await hasCredentials(configuration, secrets);
      const oas = stringify(extractSingleOperation(method, path as string, bundle.value));
      // prefer anond credentials for now
      if (credentials === "anond") {
        return runAnondAudit(editor.document, oas, bundle.mapping, cache, configuration, progress);
      } else if (credentials === "platform") {
        return runPlatformAudit(editor.document, oas, bundle.mapping, cache, store);
      }
    }
  );
}

export async function registerSingleOperationAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  view: AuditWebView,
  store: PlatformStore
): Promise<void> {
  vscode.commands.registerTextEditorCommand(
    "openapi.editorSingleOperationAudit",
    async (editor: vscode.TextEditor, edit, path: string, method: HttpMethod) => {
      const uri = editor.document.uri.toString();
      await view.show();
      await view.sendColorTheme(vscode.window.activeColorTheme);
      view.prefetchKdb();
      await view.sendStartAudit();
      try {
        const audit = await singleOperationSecurityAudit(
          path,
          method,
          cache,
          configuration,
          context.secrets,
          store,
          editor
        );
        if (audit) {
          setAudit(auditContext, uri, audit);
          setDecorations(editor, auditContext);
          await view.showReport(audit);
        }
      } catch (ex: any) {
        console.log("error", ex);
      }
    }
  );
}
