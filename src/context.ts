/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { find } from "@xliic/preserving-json-yaml-parser";
import * as vscode from "vscode";
import { Cache } from "./cache";
import { OpenApiVersion } from "./types";

export async function updateContext(cache: Cache, document: vscode.TextDocument | undefined) {
  if (!document) {
    // don't disable outlines when no editor is selected (which happens if audit or preview
    // webviews are selected) to prevent flicker
    return;
  }

  const version = cache.getDocumentVersion(document);

  if (version !== OpenApiVersion.Unknown) {
    if (version === OpenApiVersion.V2) {
      vscode.commands.executeCommand("setContext", "openapiTwoEnabled", true);
      vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
    } else if (version === OpenApiVersion.V3) {
      vscode.commands.executeCommand("setContext", "openapiThreeEnabled", true);
      vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
    }
    vscode.commands.executeCommand("setContext", "openapiDocumentScheme", document?.uri?.scheme);
    const root = cache.getLastGoodParsedDocument(document);
    if (root) {
      checkTree(root);
    }
  } else {
    vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
    vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
  }
}

function checkTree(tree: any) {
  setContext("openapiMissingHost", isMissing(tree, "/host"));
  setContext("openapiMissingBasePath", isMissing(tree, "/basePath"));
  setContext("openapiMissingInfo", isMissing(tree, "/info"));
}

function isMissing(tree: any, pointer: string): boolean {
  return find(tree, pointer) === undefined;
}

function setContext(name: string, value: boolean) {
  vscode.commands.executeCommand("setContext", name, value);
}
