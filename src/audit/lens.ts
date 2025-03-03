import * as vscode from "vscode";

import { BundledSwaggerOrOasSpec, getOperations } from "@xliic/openapi";
import { getLocation } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../cache";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";

const supportedVersions = [OpenApiVersion.V2, OpenApiVersion.V3, OpenApiVersion.V3_1];

export class AuditCodelensProvider implements vscode.CodeLensProvider {
  private lenses: Record<string, vscode.CodeLens[]> = {};

  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const parsed = this.cache.getParsedDocument(document);
    if (supportedVersions.includes(getOpenApiVersion(parsed))) {
      const result: (vscode.CodeLens | undefined)[] = [];
      const oas = parsed as unknown as BundledSwaggerOrOasSpec;
      const operations = getOperations(oas);
      for (const [path, method, operation] of operations) {
        result.push(auditLens(document, oas, path, method));
      }

      result.push(topAuditLens(document));

      this.lenses[document.uri.toString()] = result.filter(
        (lens): lens is vscode.CodeLens => lens !== undefined
      );
    }

    return this.lenses[document.uri.toString()];
  }
}

function auditLens(
  document: vscode.TextDocument,
  oas: BundledSwaggerOrOasSpec,
  path: string,
  method: string
): vscode.CodeLens | undefined {
  const pathItem = oas.paths?.[path];

  if (!pathItem) {
    return undefined;
  }

  const location = getLocation(pathItem, method);

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
  const line = document.lineAt(0);
  return new vscode.CodeLens(line.range, {
    title: "Audit",
    tooltip: "Audit this OpenAPI file",
    command: "openapi.securityAudit",
  });
}
