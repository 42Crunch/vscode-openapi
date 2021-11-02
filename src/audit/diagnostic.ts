/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { AuditDiagnostic } from "../types";

export function updateDiagnostics(
  diagnostics: vscode.DiagnosticCollection,
  filename: string,
  issues,
  textEditor: vscode.TextEditor
): vscode.DiagnosticCollection {
  for (const uri of Object.keys(issues)) {
    diagnostics.set(vscode.Uri.parse(uri), createDiagnosticsForUri(filename, uri, issues[uri]));
  }
  return diagnostics;
}

export function createDiagnosticsForUri(filename: string, uri: string, issues): AuditDiagnostic[] {
  const criticalityToSeverity = {
    1: vscode.DiagnosticSeverity.Hint,
    2: vscode.DiagnosticSeverity.Information,
    3: vscode.DiagnosticSeverity.Warning,
    4: vscode.DiagnosticSeverity.Error,
    5: vscode.DiagnosticSeverity.Error,
  };

  return issues.map(
    (issue): AuditDiagnostic => ({
      source: `audit of ${filename}`,
      id: issue.id,
      pointer: issue.pointer,
      //message: issue.message,
      message: `${issue.description} ${
        issue.displayScore !== "0" ? `(score impact ${issue.displayScore})` : ""
      }`,
      severity: criticalityToSeverity[issue.criticality],
      range: issue.range,
    })
  );
}
