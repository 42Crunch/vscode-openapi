import * as vscode from "vscode";
import { Cache } from "../../cache";
import { BundledOpenApiSpec, getOperations } from "@xliic/common/oas30";
import { getLocation } from "@xliic/preserving-json-yaml-parser";
import { getOpenApiVersion } from "../../parsers";
import { OpenApiVersion } from "../../types";

export class ScanCodelensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void>;
  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const result: vscode.CodeLens[] = [];
    const parsed = this.cache.getParsedDocument(document);
    const version = getOpenApiVersion(parsed);
    // TODO support Swagger 2.0
    if (parsed && version === OpenApiVersion.V3) {
      const oas = parsed as unknown as BundledOpenApiSpec;
      const operations = getOperations(oas);
      for (const [path, method, operation] of operations) {
        const lens = scanLens(document, oas, path, method);
        if (lens) {
          result.push(lens);
        }
      }
    }

    return result;
  }
}

function scanLens(
  document: vscode.TextDocument,
  oas: BundledOpenApiSpec,
  path: string,
  method: string
): vscode.CodeLens | undefined {
  const location = getLocation(oas.paths[path], method);
  if (!location) {
    return undefined;
  }

  const position = document.positionAt(location!.key!.start);
  const line = document.lineAt(position.line + 1);
  const range = new vscode.Range(
    new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex),
    new vscode.Position(position.line + 1, line.range.end.character)
  );

  return new vscode.CodeLens(range, {
    title: `Scan`,
    tooltip: "Scan this operation",
    command: "openapi.platform.editorRunSingleOperationScan",
    arguments: [document.uri, path, method],
  });
}
