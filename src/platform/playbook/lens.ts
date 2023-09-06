import * as vscode from "vscode";
import { Cache } from "../../cache";
import { getOperations as getOpenApiOperations } from "@xliic/common/oas30";
import { getOperations as getSwaggerOperations } from "@xliic/common/swagger";
import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";

import { getLocation } from "@xliic/preserving-json-yaml-parser";
import { getOpenApiVersion } from "../../parsers";
import { OpenApiVersion } from "../../types";

export class PlaybookCodelensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void>;
  constructor(private cache: Cache) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const result: vscode.CodeLens[] = [];
    const parsed = this.cache.getParsedDocument(document);
    //const version = getOpenApiVersion(parsed);

    const authDetails = (parsed as any)["authenticationDetails"];
    if (parsed && authDetails) {
      const lens = scanLens(document, parsed);
      if (lens) {
        result.push(lens);
      }
    }

    // const operations = (parsed as any)["operations"];
    // if (parsed && (parsed as any)["runtimeConfiguration"] && operations) {
    //   for (const operation of Object.keys(operations)) {
    //     const opId = operations[operation]["operationId"];
    //     const lens = scanLens(document, parsed, operation, opId);
    //     if (lens) {
    //       result.push(lens);
    //     }
    //   }
    //   // const oas = parsed as unknown as BundledSwaggerOrOasSpec;
    //   // const operations = isOpenapi(oas) ? getOpenApiOperations(oas) : getSwaggerOperations(oas);
    //   // for (const [path, method, operation] of operations) {
    //   //   const lens = scanLens(document, oas, path, method);
    //   //   if (lens) {
    //   //     result.push(lens);
    //   //   }
    //   // }
    // }

    return result;
  }
}

function scanLens(document: vscode.TextDocument, parsed: any): vscode.CodeLens | undefined {
  const location = getLocation(parsed, "authenticationDetails");
  if (!location) {
    return undefined;
  }

  const position = document.positionAt(location!.key!.start);
  const line = document.lineAt(position.line + 1);
  const range = new vscode.Range(
    new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex),
    new vscode.Position(position.line + 1, line.range.end.character)
  );
  const authDetails = (parsed as any)["authenticationDetails"];
  return new vscode.CodeLens(range, {
    title: `Todo`,
    tooltip: "Todo this operation",
    command: "playbook.showAuthDetails",
    arguments: [document.uri, authDetails],
  });
}

// function scanLens(
//   document: vscode.TextDocument,
//   parsed: any,
//   operation: string,
//   operationId: string
// ): vscode.CodeLens | undefined {
//   const operations = (parsed as any)["operations"];
//   const location = getLocation(operations, operation);
//   if (!location) {
//     return undefined;
//   }

//   const position = document.positionAt(location!.key!.start);
//   const line = document.lineAt(position.line + 1);
//   const range = new vscode.Range(
//     new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex),
//     new vscode.Position(position.line + 1, line.range.end.character)
//   );

//   return new vscode.CodeLens(range, {
//     title: `Todo`,
//     tooltip: "Todo this operation",
//     command: "openapi.platform.editorRunSingleOperationScan_todo",
//     arguments: [document.uri, operationId],
//   });
// }
