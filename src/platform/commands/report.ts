import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { Cache } from "../../cache";
import { AuditNode } from "../explorer/nodes/api";
import { refreshAuditReport } from "../audit";
import { AuditContext } from "../../types";
import { makePlatformUri } from "../util";
import { ReportWebView } from "../../audit/report";

export default (
  store: PlatformStore,
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache
) => ({
  openAuditReport: async (apiId: string) => {
    await vscode.window.withProgress<void>(
      {
        title: `Loading Audit Report for API ${apiId}`,
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      async () => {
        const uri = makePlatformUri(apiId);
        const document = await vscode.workspace.openTextDocument(uri);
        const audit = await refreshAuditReport(store, cache, auditContext, document);
        ReportWebView.show(context.extensionPath, audit, cache);
      }
    );
  },
});
