/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Node } from "./ast";
import { OpenApiVersion, CacheEntry } from "./types";

export function updateContext(current: CacheEntry) {
  if (current.version === OpenApiVersion.V2) {
    vscode.commands.executeCommand("setContext", "openapiTwoEnabled", true);
    vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
  } else if (current.version === OpenApiVersion.V3) {
    vscode.commands.executeCommand("setContext", "openapiThreeEnabled", true);
    vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
  } else {
    vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
    vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
  }

  if (current.lastGoodRoot) {
    checkTree(current.lastGoodRoot);
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
