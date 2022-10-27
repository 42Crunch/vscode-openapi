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
import { AuditWebView } from "./view";
import { AuditContext, PendingAudits } from "../types";
import { registerQuickfixes } from "./quickfix";
import { Cache } from "../cache";
import { setDecorations } from "./decoration";
import { PlatformStore } from "../platform/stores/platform-store";

export function activate(
  context: vscode.ExtensionContext,
  auditContext: AuditContext,
  cache: Cache,
  reportWebView: AuditWebView,
  store: PlatformStore
) {
  const pendingAudits: PendingAudits = {};

  function update(editor: vscode.TextEditor | undefined) {
    if (editor) {
      setDecorations(editor, auditContext);
      const uri = editor.document.uri.toString();
      if (auditContext.auditsByMainDocument[uri]) {
        reportWebView.showIfVisible(auditContext.auditsByMainDocument[uri]);
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
          reportWebView.showNoReport();
        }
      }
    }
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => update(editor));

  registerSecurityAudit(context, cache, auditContext, pendingAudits, reportWebView, store);
  registerFocusSecurityAudit(context, cache, auditContext, reportWebView);
  registerFocusSecurityAuditById(context, auditContext, reportWebView);
  registerQuickfixes(context, cache, auditContext, reportWebView);
}
