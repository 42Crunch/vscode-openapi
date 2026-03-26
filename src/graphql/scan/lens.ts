import * as vscode from "vscode";

import { Cache } from "../../cache";
import { isGqlExt } from "../../util";

export class ScanGqlCodelensProvider implements vscode.CodeLensProvider {
  private lenses: Record<string, vscode.CodeLens[]> = {};

  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): Promise<vscode.CodeLens[]> {
    const result: (vscode.CodeLens | undefined)[] = [];
    if (isGqlExt(document)) {
      result.push(topScanLens(document));

      this.lenses[document.uri.toString()] = result.filter(
        (lens): lens is vscode.CodeLens => lens !== undefined,
      );
    }

    return this.lenses[document.uri.toString()];
  }
}

function topScanLens(document: vscode.TextDocument): vscode.CodeLens | undefined {
  const line = document.lineAt(0);
  return new vscode.CodeLens(line.range, {
    title: `Scan`,
    tooltip: "Scan this GraphQL file",
    command: "openapi.graphql.editorRunFirstOperationScan",
    arguments: [document.uri, null, null],
  });
}
