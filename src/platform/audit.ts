import * as vscode from "vscode";
import { Audit } from "@xliic/common/audit";
import { parseAuditReport } from "../audit/audit";
import { setDecorations } from "../audit/decoration";
import { Cache } from "../cache";

import { AuditContext } from "../types";
import { PlatformStore } from "./stores/platform-store";
import { getApiId, isPlatformUri } from "./util";
import { setAudit } from "../audit/service";
import { saveAuditReportToTempDirectory } from "../audit/util";

export async function refreshAuditReport(
  store: PlatformStore,
  cache: Cache,
  auditContext: AuditContext,
  document: vscode.TextDocument
): Promise<Audit | undefined> {
  if (isPlatformUri(document.uri)) {
    const uri = document.uri.toString();
    const apiId = getApiId(document.uri)!;
    const report = await store.getAuditReport(apiId);
    const compliance = await store.readAuditCompliance(report.tid);
    const todoReport = await store.readAuditReportSqgTodo(report.tid);
    const tempAuditDirectory = await saveAuditReportToTempDirectory(report.data);

    const mapping = {
      value: { uri, hash: "" },
      children: {},
    };

    const audit = await parseAuditReport(cache, document, report.data, mapping);
    const { issues: todo } = await parseAuditReport(cache, document, todoReport.data, mapping);
    audit.compliance = compliance;
    audit.todo = todo;

    if (audit) {
      // TODO better handling of failing autids
      // since we don't prevent incorrect JSON from being submitted
      // audits might fail
      // also need to trigger setDecorations() on document update
      if (Object.keys(audit.issues).length === 0) {
        auditContext.diagnostics.set(document.uri, undefined);
        auditContext.decorations[uri] = [];
      } else {
        setAudit(auditContext, uri, audit, tempAuditDirectory);
      }
      if (vscode.window.activeTextEditor?.document === document) {
        setDecorations(vscode.window.activeTextEditor, auditContext);
      }
      return audit;
    }
  }
}
