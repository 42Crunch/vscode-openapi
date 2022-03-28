import * as vscode from "vscode";
import { Cache } from "../cache";
import { BundledOpenApiSpec, getOperations } from "@xliic/common/oas30";
import { getLocation } from "@xliic/preserving-json-yaml-parser";

export class TryItCodelensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void>;
  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const result = [];
    const parsed = this.cache.getParsedDocument(document);
    if (parsed) {
      const oas = parsed as unknown as BundledOpenApiSpec;
      const operations = getOperations(oas);
      for (const [path, method, operation] of operations) {
        const location = getLocation(oas.paths[path], method);
        const position = document.positionAt(location!.key!.start);
        const line = document.lineAt(position.line + 1);
        const range = new vscode.Range(
          new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex),
          new vscode.Position(position.line + 1, line.range.end.character)
        );

        const tryItLens = new vscode.CodeLens(range, {
          title: `Try it`,
          tooltip: "Try this operation by sending a request",
          command: "openapi.tryOperation",
          arguments: [document.uri, path, method],
        });

        result.push(tryItLens);
      }
    }

    return result;
  }
}
