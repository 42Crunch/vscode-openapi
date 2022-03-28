/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Cache } from "../../cache";
import { PlatformStore } from "../stores/platform-store";
import { DataDictionaryDiagnostic } from "../../types";

export class DataDictionaryCodeActions implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
  constructor(
    private cache: Cache,
    private store: PlatformStore,
    private collection: vscode.DiagnosticCollection
  ) {}
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const diagnostics = this.collection.get(document.uri) || [];
    const actions: vscode.CodeAction[] = [];
    for (const diagnostic of diagnostics as DataDictionaryDiagnostic[]) {
      if (
        diagnostic.range.contains(range) &&
        diagnostic["id"] === "data-dictionary-format-property-mismatch"
      ) {
        const action = new vscode.CodeAction(
          `Update "${diagnostic.property}" with Data Dictionary value`,
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          command: "openapi.platform.editorDataDictionaryUpdateProperty",
          title: `Update "${diagnostic.property}" with Data Dictionary value`,
          arguments: [diagnostic.format, diagnostic.node, diagnostic.property, diagnostic.path],
        };
        action.isPreferred = true;
        actions.push(action);

        const action2 = new vscode.CodeAction(
          `Update "${diagnostic.path.slice(-1)}" with all Data Dictionary properties`,
          vscode.CodeActionKind.QuickFix
        );
        action2.command = {
          command: "openapi.platform.editorDataDictionaryUpdateAllProperties",
          title: `Update "${diagnostic.path.slice(-1)}" with all Data Dictionary properties`,
          arguments: [diagnostic.format, diagnostic.node, diagnostic.path],
        };
        actions.push(action2);

        const action3 = new vscode.CodeAction(
          `Update Data Dictionary properties everywhere in the document`,
          vscode.CodeActionKind.QuickFix
        );
        action3.command = {
          command: "openapi.platform.editorDataDictionaryBulkUpdateProperties",
          title: `Update Data Dictionary properties everywhere in the document`,
        };
        actions.push(action3);
      }
      if (
        diagnostic.range.contains(range) &&
        diagnostic["id"] === "data-dictionary-format-property-missing"
      ) {
        const action = new vscode.CodeAction(
          `Add missing "${diagnostic.property}" Data Dictionary property`,
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          command: "openapi.platform.editorDataDictionaryUpdateProperty",
          title: `Add missing "${diagnostic.property}" Data Dictionary property`,
          arguments: [diagnostic.format, diagnostic.node, diagnostic.property, diagnostic.path],
        };
        actions.push(action);
      }
    }

    return actions;
  }
}
