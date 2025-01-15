/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Audit } from "@xliic/common/audit";
import { HttpMethod } from "@xliic/openapi";
import { stringify } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../cache";
import { Configuration, configuration } from "../configuration";
import { ensureHasCredentials } from "../credentials";
import { OperationIdNode } from "../outlines/nodes/operation-ids";
import { OperationNode } from "../outlines/nodes/paths";
import { TagChildNode } from "../outlines/nodes/tags";
import { getPathAndMethod } from "../outlines/util";
import { ensureCliDownloaded } from "../platform/cli-ast";
import { PlatformStore } from "../platform/stores/platform-store";
import { AuditContext, Bundle, PendingAudits } from "../types";
import { extractSingleOperation } from "../util/extract";
import { setDecorations } from "./decoration";
import { runCliAudit } from "./runtime/cli";
import { runPlatformAudit } from "./runtime/platform";
import { setAudit } from "./service";
import { AuditWebView } from "./view";
import { loadConfig } from "../util/config";
import { SignUpWebView } from "../webapps/signup/view";
import { exists } from "../util/fs";
import { join } from "node:path";

export function registerSecurityAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  signUpWebView: SignUpWebView
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityAudit",
    async (textEditor: vscode.TextEditor, edit) => {
      await securityAudit(
        signUpWebView,
        context.workspaceState,
        context.secrets,
        cache,
        auditContext,
        pendingAudits,
        reportWebView,
        store,
        textEditor
      );
    }
  );
}

export function registerSingleOperationAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  signUpWebView: SignUpWebView
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.editorSingleOperationAudit",
    async (textEditor: vscode.TextEditor, edit, path: string, method: HttpMethod) => {
      await securityAudit(
        signUpWebView,
        context.workspaceState,
        context.secrets,
        cache,
        auditContext,
        pendingAudits,
        reportWebView,
        store,
        textEditor,
        path,
        method
      );
    }
  );
}

export function registerOutlineSingleOperationAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  signUpWebView: SignUpWebView
) {
  return vscode.commands.registerCommand(
    "openapi.outlineSingleOperationAudit",
    async (node: OperationNode | TagChildNode | OperationIdNode) => {
      if (!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      const { path, method } = getPathAndMethod(node);

      await securityAudit(
        signUpWebView,
        context.workspaceState,
        context.secrets,
        cache,
        auditContext,
        pendingAudits,
        reportWebView,
        store,
        vscode.window.activeTextEditor,
        path,
        method
      );
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

export function registerExportAuditReport(
  context: vscode.ExtensionContext,
  auditContext: AuditContext
) {
  return vscode.commands.registerCommand("openapi.exportAuditReport", async () => {
    if (!vscode.window.activeTextEditor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }
    const documentUri = vscode.window.activeTextEditor.document.uri.toString();
    const tempAuditDirectory = auditContext.auditTempDirectories[documentUri];

    if (tempAuditDirectory && (await exists(`${tempAuditDirectory}/report.json`))) {
      const destination = await vscode.window.showSaveDialog({
        filters: { JSON: ["json"] },
      });

      if (destination !== undefined) {
        const reportUri = vscode.Uri.file(join(tempAuditDirectory, "report.json"));
        vscode.workspace.fs.copy(reportUri, destination, { overwrite: true });
      }
    } else {
      vscode.window.showErrorMessage("No audit report found for this document");
    }
  });
}

async function securityAudit(
  signUpWebView: SignUpWebView,
  memento: vscode.Memento,
  secrets: vscode.SecretStorage,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  editor: vscode.TextEditor,
  path?: string,
  method?: HttpMethod
) {
  if (!(await ensureHasCredentials(signUpWebView, configuration, secrets))) {
    return;
  }

  if (!(await offerDataDictionaryUpdateAndContinue(editor.document.uri))) {
    return;
  }

  const uri = editor.document.uri.toString();

  if (pendingAudits[uri]) {
    vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
    return;
  }

  delete auditContext.auditsByMainDocument[uri];
  pendingAudits[uri] = true;

  try {
    reportWebView.prefetchKdb();
    await reportWebView.sendStartAudit();
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running API Security Audit...",
        cancellable: false,
      },
      async (
        progress,
        cancellationToken
      ): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> => {
        const isFullAudit = path === undefined || method === undefined;
        const { value, mapping } = await bundleOrThrow(cache, editor.document);
        const oas = isFullAudit
          ? stringify(value)
          : stringify(extractSingleOperation(method, path as string, value));
        if ((await chooseAuditRuntime(configuration, secrets)) === "platform") {
          return runPlatformAudit(editor.document, oas, mapping, cache, store, memento);
        } else {
          // use CLI
          if (await ensureCliDownloaded(configuration, secrets)) {
            const tags = store.isConnected()
              ? await store.getTagsForDocument(editor.document, memento)
              : [];
            return runCliAudit(
              editor.document,
              oas,
              mapping,
              tags,
              cache,
              secrets,
              configuration,
              progress,
              isFullAudit
            );
          } else {
            // cli is not available and user chose to cancel download
            vscode.window.showErrorMessage(
              "42Crunch API Security Testing Binary is required to run Audit."
            );
            return;
          }
        }
      }
    );

    if (result) {
      setAudit(auditContext, uri, result.audit, result.tempAuditDirectory);
      setDecorations(editor, auditContext);
      await reportWebView.showReport(result.audit);
    } else {
      await reportWebView.sendCancelAudit();
    }
    delete pendingAudits[uri];
  } catch (e) {
    delete pendingAudits[uri];
    vscode.window.showErrorMessage(`Failed to audit: ${e}`);
  }
}

async function bundleOrThrow(cache: Cache, document: vscode.TextDocument): Promise<Bundle> {
  const bundle = await cache.getDocumentBundle(document, { rebundle: true });

  if (!bundle || "errors" in bundle) {
    vscode.commands.executeCommand("workbench.action.problems.focus");
    throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
  }

  return bundle;
}

async function offerDataDictionaryUpdateAndContinue(documentUri: vscode.Uri): Promise<boolean> {
  const proceed = await vscode.commands.executeCommand(
    "openapi.platform.dataDictionaryPreAuditBulkUpdateProperties",
    documentUri
  );

  return proceed === true;
}

async function chooseAuditRuntime(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<"platform" | "cli"> {
  const config = await loadConfig(configuration, secrets);
  // paid users are allowed to choose the runtime, freemium users always use the cli
  if (config.platformAuthType === "api-token") {
    return config.auditRuntime;
  } else {
    return "cli";
  }
}
