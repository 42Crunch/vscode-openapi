import * as vscode from "vscode";

import { Cache } from "../../cache";
import { DocumentNode } from "graphql/language/ast";

export class ScanGqlCodelensProvider implements vscode.CodeLensProvider {
  private lenses: Record<string, vscode.CodeLens[]> = {};

  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): Promise<vscode.CodeLens[]> {
    // const parsed = this.cache.getParsedDocument(document);
    // if (supportedVersions.includes(getOpenApiVersion(parsed))) {
    //   const result: (vscode.CodeLens | undefined)[] = [];
    //   const oas = parsed as unknown as BundledSwaggerOrOas30Spec;

    //   result.push(topScanLens(document, oas));

    //   this.lenses[document.uri.toString()] = result.filter(
    //     (lens): lens is vscode.CodeLens => lens !== undefined
    //   );
    // }
    // TODO: move to a util function
    const result: (vscode.CodeLens | undefined)[] = [];
    if (
      document.fileName.endsWith(".graphql") ||
      document.fileName.endsWith(".gql") ||
      document.fileName.endsWith(".graphqls") ||
      document.fileName.endsWith(".sdl") ||
      document.fileName.endsWith(".gqls")
    ) {
      result.push(topScanLens(document, null));

      this.lenses[document.uri.toString()] = result.filter(
        (lens): lens is vscode.CodeLens => lens !== undefined,
      );
    }

    return this.lenses[document.uri.toString()];
  }
}

function topScanLens(
  document: vscode.TextDocument,
  gqlAst: DocumentNode | null,
): vscode.CodeLens | undefined {
  // find first operation's path and method, and bail if not found
  // const firstPath = Object.keys(oas.paths)[0];
  // if (firstPath === undefined) {
  //   return undefined;
  // }

  // const firstMethod = Object.keys(oas.paths[firstPath])[0];
  // if (firstMethod === undefined) {
  //   return undefined;
  // }

  // const location = getLocation(oas.paths[firstPath], firstMethod);

  // if (!location) {
  //   return undefined;
  // }

  const line = document.lineAt(0);
  return new vscode.CodeLens(line.range, {
    title: `Scan`,
    tooltip: "Scan this GraphQL file",
    command: "openapi.graphql.editorRunSingleOperationScan",
    arguments: [document.uri, null, null],
  });
}
