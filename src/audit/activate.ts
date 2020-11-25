/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import { RuntimeContext, OpenApiVersion } from '../types';
import { registerSecurityAudit, registerFocusSecurityAudit, registerFocusSecurityAuditById } from './commands';
import { ReportWebView } from './report';
import { setDecorations } from './decoration';
import { AuditContext } from './types';
import { registerQuickfixes } from './quickfix';

export function activate(context: vscode.ExtensionContext, runtimeContext: RuntimeContext) {
  const auditContext: AuditContext = {};
  const pendingAudits: { [uri: string]: boolean } = {};

  runtimeContext.didChangeEditor(([editor, version]) => {
    if (editor) {
      setDecorations(editor, auditContext);
      const uri = editor.document.uri.toString();
      if (auditContext[uri]) {
        ReportWebView.showIfVisible(auditContext[uri]);
      } else {
        let subdocument = false;
        for (const audit of Object.values(auditContext)) {
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
  });

  registerSecurityAudit(context, runtimeContext, auditContext, pendingAudits);
  registerFocusSecurityAudit(context, auditContext);
  registerFocusSecurityAuditById(context, auditContext);
  registerQuickfixes(context, auditContext);
}
