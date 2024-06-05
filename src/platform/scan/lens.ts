import * as vscode from "vscode";

import { OpenApi30, Swagger, BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/openapi";
import { getLocation } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../../cache";
import { getOpenApiVersion } from "../../parsers";
import { OpenApiVersion } from "../../types";

export class ScanCodelensProvider implements vscode.CodeLensProvider {
  private lenses: Record<string, vscode.CodeLens[]> = {};

  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const parsed = this.cache.getParsedDocument(document);
    const version = getOpenApiVersion(parsed);
    if (parsed && version !== OpenApiVersion.Unknown) {
      const result: (vscode.CodeLens | undefined)[] = [];
      const oas = parsed as unknown as BundledSwaggerOrOasSpec;
      const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);
      for (const [path, method, operation] of operations) {
        result.push(scanLens(document, oas, path, method));
      }

      result.push(topScanLens(document, oas));

      this.lenses[document.uri.toString()] = result.filter(
        (lens): lens is vscode.CodeLens => lens !== undefined
      );
    }

    return this.lenses[document.uri.toString()];
  }
}

function scanLens(
  document: vscode.TextDocument,
  oas: BundledSwaggerOrOasSpec,
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

function topScanLens(
  document: vscode.TextDocument,
  oas: BundledSwaggerOrOasSpec
): vscode.CodeLens | undefined {
  // find first operation's path and method, and bail if not found
  const firstPath = Object.keys(oas.paths)[0];
  if (firstPath === undefined) {
    return undefined;
  }

  const firstMethod = Object.keys(oas.paths[firstPath])[0];
  if (firstMethod === undefined) {
    return undefined;
  }

  const location = getLocation(oas.paths[firstPath], firstMethod);

  if (!location) {
    return undefined;
  }

  const line = document.lineAt(0);
  return new vscode.CodeLens(line.range, {
    title: `Scan`,
    tooltip: "Scan this OpenAPI file",
    command: "openapi.platform.editorRunSingleOperationScan",
    arguments: [document.uri, firstPath, firstMethod],
  });
}
