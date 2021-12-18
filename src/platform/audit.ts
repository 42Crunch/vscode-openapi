import * as vscode from "vscode";
import { parseAuditReport, updateAuditContext } from "../audit/audit";
import { setDecorations, updateDecorations } from "../audit/decoration";
import { updateDiagnostics } from "../audit/diagnostic";
import { Cache } from "../cache";

import { Audit, AuditContext } from "../types";
import { PlatformStore } from "./stores/platform-store";
import { getApiId, isPlatformUri } from "./util";

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

    const audit = await parseAuditReport(cache, document, report, {
      value: { uri, hash: "" },
      children: {},
    });

    if (audit) {
      // TODO better handling of failing autids
      // since we don't prevent incorrect JSON from being submitted
      // audits might fail
      // also need to trigger setDecorations() on document update
      if (Object.keys(audit.issues).length === 0) {
        auditContext.diagnostics.set(document.uri, undefined);
        auditContext.decorations[uri] = [];
      } else {
        updateAuditContext(auditContext, uri, audit);
        updateDecorations(auditContext.decorations, audit.summary.documentUri, audit.issues);
        updateDiagnostics(auditContext.diagnostics, audit.filename, audit.issues);
      }
      if (vscode.window.activeTextEditor?.document === document) {
        setDecorations(vscode.window.activeTextEditor, auditContext);
      }
      return audit;
    }
  }
}
