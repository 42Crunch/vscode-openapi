import * as vscode from "vscode";
import { Cache } from "../cache";
import { OpenApi30, Swagger, BundledSwaggerOrOasSpec, isOpenapi, deref } from "@xliic/openapi";
import { getLocation } from "@xliic/preserving-json-yaml-parser";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";

export class TryItCodelensProvider implements vscode.CodeLensProvider {
  private lenses: Record<string, vscode.CodeLens[]> = {};

  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const parsed = this.cache.getParsedDocument(document);
    const version = getOpenApiVersion(parsed);
    if (parsed && version !== OpenApiVersion.Unknown) {
      const result: vscode.CodeLens[] = [];
      const oas = parsed as unknown as BundledSwaggerOrOasSpec;
      const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);
      for (const [path, method, operation] of operations) {
        const tryOperationLens = operationLens(document, oas, path, method);
        if (tryOperationLens) {
          result.push(tryOperationLens);
        }
        // TODO examples in swagger
        if (isOpenapi(oas)) {
          result.push(
            ...operationExamplesLens(document, oas, path, method, operation as OpenApi30.Operation)
          );
        }
      }

      this.lenses[document.uri.toString()] = result;
    }

    return this.lenses[document.uri.toString()];
  }
}

function operationLens(
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
    title: `Try it`,
    tooltip: "Try this operation by sending a request",
    command: "openapi.tryOperation",
    arguments: [document, path, method],
  });
}

function operationExamplesLens(
  document: vscode.TextDocument,
  oas: OpenApi30.BundledSpec,
  path: string,
  method: string,
  operation: OpenApi30.Operation
): vscode.CodeLens[] {
  const result = [];
  const content = deref(oas, operation.requestBody)?.content;
  for (const [mediaType, mediaTypeContent] of Object.entries(content || {})) {
    const examples = mediaTypeContent.examples;
    if (examples) {
      for (const [name, exampleOrRef] of Object.entries(examples)) {
        const location = getLocation(examples, name);
        const example = deref(oas, exampleOrRef);
        if (location && example?.value !== undefined) {
          const position = document.positionAt(location!.key!.start);
          const line = document.lineAt(position.line + 1);
          const range = new vscode.Range(
            new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex),
            new vscode.Position(position.line + 1, line.range.end.character)
          );
          result.push(
            new vscode.CodeLens(range, {
              title: `Try it`,
              tooltip:
                "Try this operation by sending a request, use this example for the request body",
              command: "openapi.tryOperationWithExample",
              arguments: [document, path, method, mediaType, example.value],
            })
          );
        }
      }
    }
  }
  return result;
}
