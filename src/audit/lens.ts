import * as vscode from "vscode";

import { OpenApi30, Swagger, BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/openapi";
import { getLocation } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../cache";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";

export class AuditCodelensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void>;
  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const result: (vscode.CodeLens | undefined)[] = [];
    const parsed = this.cache.getParsedDocument(document);
    const version = getOpenApiVersion(parsed);
    if (parsed && version !== OpenApiVersion.Unknown) {
      const oas = parsed as unknown as BundledSwaggerOrOasSpec;
      const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);
      for (const [path, method, operation] of operations) {
        result.push(auditLens(document, oas, path, method));
      }
      result.push(topAuditLens(document));
    }

    return result.filter((lens): lens is vscode.CodeLens => lens !== undefined);
  }
}

function auditLens(
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
    title: `Audit`,
    tooltip: "Audit this operation",
    command: "openapi.editorSingleOperationAudit",
    arguments: [path, method],
  });
}

function topAuditLens(document: vscode.TextDocument): vscode.CodeLens | undefined {
  const position = document.positionAt(0);
  const line = document.lineAt(position.line + 1);
  const range = new vscode.Range(
    new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
    new vscode.Position(position.line, line.range.end.character)
  );

  return new vscode.CodeLens(range, {
    title: "Audit",
    tooltip: "Audit this OpenAPI file",
    command: "openapi.securityAudit",
  });
}
