import * as vscode from "vscode";

import { Audit } from "@xliic/common/audit";

import { AuditContext } from "../types";
import { updateAuditContext } from "./audit";
import { updateDecorations } from "./decoration";
import { updateDiagnostics } from "./diagnostic";

export function setAudit(
  context: AuditContext,
  uri: string,
  audit: Audit,
  tempAuditDirectory: string
) {
  updateAuditContext(context, uri, audit, tempAuditDirectory);
  updateDecorations(context.decorations, audit.summary.documentUri, audit.issues);
  updateDiagnostics(context.diagnostics, audit.filename, audit.issues);
}

export function clearAudit(context: AuditContext, uri: string) {
  const audit = context.auditsByMainDocument[uri];
  if (audit) {
    delete context.auditsByMainDocument[uri];
    delete context.auditsByDocument[uri];
    for (const subdocumentUri of audit.summary.subdocumentUris) {
      delete context.auditsByDocument[subdocumentUri];
    }
    delete context.decorations[uri];
    context.diagnostics.delete(vscode.Uri.parse(uri));
  }
}
