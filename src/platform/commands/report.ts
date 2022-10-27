import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { Cache } from "../../cache";
import { refreshAuditReport } from "../audit";
import { AuditContext } from "../../types";
import { makePlatformUri } from "../util";
import { AuditWebView } from "../../audit/view";
import { parseAuditReport, updateAuditContext } from "../../audit/audit";
import { setDecorations, updateDecorations } from "../../audit/decoration";
import { updateDiagnostics } from "../../audit/diagnostic";

export default (
  store: PlatformStore,
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  reportWebView: AuditWebView
) => ({
  openAuditReport: async (apiId: string) => {
    await vscode.window.withProgress<void>(
      {
        title: `Loading Audit Report for API ${apiId}`,
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      async () => {
        try {
          const uri = makePlatformUri(apiId);
          const document = await vscode.workspace.openTextDocument(uri);
          const audit = await refreshAuditReport(store, cache, auditContext, document);
          if (audit) {
            await reportWebView.showReport(audit);
          }
        } catch (e) {
          vscode.window.showErrorMessage(`Unexpected error: ${e}`);
        }
      }
    );
  },

  editorLoadAuditReportFromFile: async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
    const selection = await vscode.window.showOpenDialog({
      title: "Load Security Audit report",
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      // TODO use language filter from extension.ts
      filters: {
        OpenAPI: ["json", "yaml", "yml"],
      },
    });

    if (selection) {
      const text = await vscode.workspace.fs.readFile(selection[0]);
      const report = JSON.parse(Buffer.from(text).toString("utf-8"));
      if (report?.aid && report?.tid && report.data?.assessmentVersion) {
        const uri = editor.document.uri.toString();
        const audit = await parseAuditReport(cache, editor.document, report.data, {
          value: { uri, hash: "" },
          children: {},
        });
        updateAuditContext(auditContext, uri, audit);
        updateDecorations(auditContext.decorations, audit.summary.documentUri, audit.issues);
        updateDiagnostics(auditContext.diagnostics, audit.filename, audit.issues);
        setDecorations(editor, auditContext);
        await reportWebView.showReport(audit);
      } else {
        vscode.window.showErrorMessage(
          "Can't find 42Crunch Security Audit report in the selected file"
        );
      }
    }
  },
});
