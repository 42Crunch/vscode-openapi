import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { Cache } from "../../cache";
import { refreshAuditReport } from "../audit";
import { AuditContext } from "../../types";
import { makePlatformUri } from "../util";
import { AuditReportWebView } from "../../audit/report";
import { ScanReportWebView } from "../scan-report";

export default (
  store: PlatformStore,
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  reportWebView: AuditReportWebView,
  scanReportView: ScanReportWebView
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
            reportWebView.show(audit);
          }
        } catch (e) {
          vscode.window.showErrorMessage(`Unexpected error: ${e}`);
        }
      }
    );
  },

  openScanReport: async (apiId: string) => {
    await vscode.window.withProgress<void>(
      {
        title: `Loading Conformance Scan Report for API ${apiId}`,
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      async () => {
        try {
          const scanReport = await store.getScanReport(apiId);
          scanReportView.show(scanReport);
        } catch (e) {
          vscode.window.showErrorMessage(`Unexpected error: ${e}`);
        }
      }
    );
  },
});
