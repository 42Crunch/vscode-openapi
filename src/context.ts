/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Node } from "@xliic/openapi-ast-node";
import { Cache } from "./cache";
import { OpenApiVersion } from "./types";

export async function updateContext(cache: Cache, document: vscode.TextDocument) {
  const version = cache.getDocumentVersion(document);

  if (version !== OpenApiVersion.Unknown) {
    if (version === OpenApiVersion.V2) {
      vscode.commands.executeCommand("setContext", "openapiTwoEnabled", true);
      vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
    } else if (version === OpenApiVersion.V3) {
      vscode.commands.executeCommand("setContext", "openapiThreeEnabled", true);
      vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
    }
    const root = cache.getLastGoodDocumentAst(document);
    if (root) {
      checkTree(root);
    }
  } else {
    vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
    vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
  }
}

function checkTree(tree: Node) {
  setContext("openapiMissingHost", isMissing(tree, "/host"));
  setContext("openapiMissingBasePath", isMissing(tree, "/basePath"));
  setContext("openapiMissingInfo", isMissing(tree, "/info"));
}

function isMissing(tree: Node, pointer: string): boolean {
  return !tree.find(pointer);
}

function setContext(name: string, value: boolean) {
  vscode.commands.executeCommand("setContext", name, value);
}
