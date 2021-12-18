/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import {
  registerSecurityAudit,
  registerFocusSecurityAudit,
  registerFocusSecurityAuditById,
} from "./commands";
import { ReportWebView } from "./report";
import { AuditContext, PendingAudits } from "../types";
import { registerQuickfixes } from "./quickfix";
import { Cache } from "../cache";
import { setDecorations } from "./decoration";

export function activate(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache
) {
  const pendingAudits: PendingAudits = {};

  function update(editor: vscode.TextEditor | undefined) {
    if (editor) {
      setDecorations(editor, auditContext);
      const uri = editor.document.uri.toString();
      if (auditContext.auditsByMainDocument[uri]) {
        ReportWebView.showIfVisible(auditContext.auditsByMainDocument[uri]);
      } else {
        let subdocument = false;
        for (const audit of Object.values(auditContext.auditsByMainDocument)) {
          if (audit.summary.subdocumentUris.includes(uri)) {
            subdocument = true;
          }
        }
        // display no report only if the current document is not a
        // part of any multi-document run
        if (!subdocument) {
          ReportWebView.showNoReport(context);
        }
      }
    }
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => update(editor));

  registerSecurityAudit(context, cache, auditContext, pendingAudits);
  registerFocusSecurityAudit(context, cache, auditContext);
  registerFocusSecurityAuditById(context, auditContext);
  registerQuickfixes(context, cache, auditContext);
}
