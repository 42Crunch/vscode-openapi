import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { Cache } from "../../cache";
import { refreshAuditReport } from "../audit";
import { AuditContext, OpenApiVersion } from "../../types";
import { makePlatformUri } from "../util";
import { AuditWebView } from "../../audit/view";
import { parseAuditReport } from "../../audit/audit";
import { setDecorations } from "../../audit/decoration";
import { setAudit } from "../../audit/service";
import { saveAuditReportToTempDirectory } from "../../audit/util";

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

  loadAuditReportFromFile: async () => {
    const editor = vscode.window.activeTextEditor;
    if (
      editor === undefined ||
      cache.getDocumentVersion(editor.document) === OpenApiVersion.Unknown
    ) {
      vscode.window.showErrorMessage(
        "Can't load Security Audit report for this document. Please open an OpenAPI document first."
      );
      return;
    }

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
      const data = extractAuditReport(report);
      if (data !== undefined) {
        const uri = editor.document.uri.toString();
        const audit = await parseAuditReport(cache, editor.document, data, {
          value: { uri, hash: "" },
          children: {},
        });
        const tempAuditDirectory = await saveAuditReportToTempDirectory(report);
        setAudit(auditContext, uri, audit, tempAuditDirectory);
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

function extractAuditReport(report: any) {
  if (report?.aid && report?.tid && report?.data?.assessmentVersion) {
    return report.data;
  } else if (report?.taskId && report?.report) {
    return report.report;
  }
  return undefined;
}
