/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import { OpenApiVersion } from '../constants';
import { registerSecurityAudit, registerFocusSecurityAudit, registerFocusSecurityAuditById } from './commands';
import { ReportWebView } from './report';
import { decorationType } from './decoration';
import { AuditContext } from './types';

export function activate(
  context: vscode.ExtensionContext,
  didChangeEditor: vscode.Event<[vscode.TextEditor, OpenApiVersion]>,
) {
  const auditContext: AuditContext = {};
  const pendingAudits: { [uri: string]: boolean } = {};

  const dirtyDocuments: {
    [uri: string]: vscode.TextDocument;
  } = {};

  vscode.workspace.onDidChangeTextDocument(e => {
    dirtyDocuments[e.document.uri.toString()] = e.document;
  });

  vscode.workspace.onDidCloseTextDocument(document => {
    const uri = document.uri.toString();
    delete dirtyDocuments[uri];
    for (const [auditUri, audit] of Object.entries(auditContext)) {
      // remove audit if the main document of the audit was closed
      if (uri == auditUri) {
        delete auditContext[auditUri];
        audit.diagnostics.dispose();
      }
    }
  });

  didChangeEditor(([editor, version]) => {
    if (editor) {
      const uri = editor.document.uri.toString();
      let combinedDecorations = [];
      for (const audit of Object.values(auditContext)) {
        for (const [decorationsUri, decoration] of Object.entries(audit.decorations)) {
          if (uri == decorationsUri) {
            combinedDecorations = combinedDecorations.concat(decoration);
          }
        }
        editor.setDecorations(decorationType, combinedDecorations);
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
    }
  });

  registerSecurityAudit(context, auditContext, pendingAudits, dirtyDocuments);
  registerFocusSecurityAudit(context, auditContext);
  registerFocusSecurityAuditById(context, auditContext);
}
