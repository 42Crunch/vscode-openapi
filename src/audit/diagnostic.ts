/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { AuditDiagnostic } from "../types";
import { Node } from "../ast";

export function createDiagnostics(
  filename: string,
  issues,
  textEditor: vscode.TextEditor
): vscode.DiagnosticCollection {
  const diagnostics = vscode.languages.createDiagnosticCollection();
  for (const uri of Object.keys(issues)) {
    diagnostics.set(vscode.Uri.parse(uri), createDiagnosticsForUri(filename, uri, issues[uri]));
  }
  return diagnostics;
}

// export function createDiagnostics(filename: string, issues, textEditor: vscode.TextEditor): vscode.DiagnosticCollection {
//   const diagnostics = vscode.languages.createDiagnosticCollection();

//   const [root, errors] = parse(textEditor.document.getText(), textEditor.document.languageId, parserOptions);
//   const ranges = [];
//   const pointers = [];
//   getListOfAllJsonPointers(root, pointers, ranges);

//   for (const uri of Object.keys(issues)) {

//     const tmp = issues[uri];
//     for (let i = 0 ; i < pointers.length ; i++) {

//       const [start, end] = ranges[i];
//       const position =  textEditor.document.positionAt(start);
//       const line =  textEditor.document.lineAt(position.line);

//       if (i < tmp.length) {

//         tmp[i].lineNo = position.line;
//         tmp[i].range = new vscode.Range(
//           new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
//           new vscode.Position(position.line, line.range.end.character),
//         );
//         tmp[i].pointer = pointers[i];
//         tmp[i].message = `ptr ${pointers[i]} line ${position.line} (${start}, ${end})`;
//       }
//       else {
//         const ci = Object.assign({}, tmp[0]);
//         ci.lineNo = position.line;
//         ci.range = new vscode.Range(
//           new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
//           new vscode.Position(position.line, line.range.end.character),
//         );
//         ci.pointer = pointers[i];
//         ci.message = `ptr ${pointers[i]} line ${position.line} (${start}, ${end})`;
//         tmp.push(ci);
//       }
//     }

//     diagnostics.set(vscode.Uri.parse(uri), createDiagnosticsForUri(filename, uri, issues[uri]));
//   }
//   return diagnostics;
// }

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

function getListOfAllJsonPointers(node: Node, pointers, ranges) {
  if (!node.getChildren()) {
    return;
  }
  for (let child of node.getChildren()) {
    if (child.getKeyRange() == null) {
      ranges.push(child.getRange());
    } else {
      ranges.push(child.getKeyRange());
    }
    pointers.push(child.getJsonPonter());
    getListOfAllJsonPointers(child, pointers, ranges);
  }
}
