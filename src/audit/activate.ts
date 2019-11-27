/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import { OpenApiVersion } from '../constants';
import { registerSecurityAudit, registerFocusSecurityAudit, registerFocusSecurityAuditById } from './commands';
import { ReportWebView } from './report';
import { decorationType } from './decoration';

interface Audit {
  pending: boolean;
  issues: any[];
  summary: any;
  decorationOptions: vscode.DecorationOptions[];
}

export function activate(
  context: vscode.ExtensionContext,
  didChangeEditor: vscode.Event<[vscode.TextEditor, OpenApiVersion]>,
) {
  const auditContext: {
    [uri: string]: Audit;
  } = {};

  const diagnostics = vscode.languages.createDiagnosticCollection('openapi-audit');

  vscode.workspace.onDidCloseTextDocument(document => {
    diagnostics.delete(document.uri);
  });

  didChangeEditor(([editor, version]) => {
    if (editor) {
      const uri = editor.document.uri.toString();
      const audit = auditContext[uri];
      if (audit && !audit.pending) {
        editor.setDecorations(decorationType, audit.decorationOptions);
        ReportWebView.updateIfVisible(audit.issues, audit.summary, uri);
      }
    }
  });

  registerSecurityAudit(context, auditContext, diagnostics);
  registerFocusSecurityAudit(context, auditContext);
  registerFocusSecurityAuditById(context, auditContext);
}
