import * as vscode from "vscode";
import { Cache } from "../cache";
import { getOperations as getOpenApiOperations } from "@xliic/common/oas30";
import { getOperations as getSwaggerOperations } from "@xliic/common/swagger";
import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";

import { getLocation } from "@xliic/preserving-json-yaml-parser";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";

export class AuditCodelensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void>;
  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const result: vscode.CodeLens[] = [];
    const parsed = this.cache.getParsedDocument(document);
    const version = getOpenApiVersion(parsed);
    if (parsed && version !== OpenApiVersion.Unknown) {
      const oas = parsed as unknown as BundledSwaggerOrOasSpec;
      const operations = isOpenapi(oas) ? getOpenApiOperations(oas) : getSwaggerOperations(oas);
      for (const [path, method, operation] of operations) {
        const lens = auditLens(document, oas, path, method);
        if (lens) {
          result.push(lens);
        }
      }
    }

    return result;
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
