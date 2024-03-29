/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";
import * as json from "jsonc-parser";
import { Cache } from "./cache";
import { ExternalRefDocumentProvider, toInternalUri } from "./external-refs";
import { ParserOptions } from "./parser-options";
import { parse, find, findLocationForJsonPointer } from "@xliic/preserving-json-yaml-parser";

function refToUri(ref: string, currentDocumentUri: vscode.Uri): vscode.Uri {
  if (ref.startsWith("#")) {
    // local reference
    return currentDocumentUri;
  }
  try {
    // see if this is an extenral url by trying to parse it,
    // if no scheme: is present, exception is thrown
    return toInternalUri(vscode.Uri.parse(ref, true));
  } catch {
    // assume a local file reference
    const baseDir = path.dirname(currentDocumentUri.fsPath);
    if (ref.includes("#")) {
      const [filename] = ref.split("#", 2);
      return currentDocumentUri.with({ path: path.join(baseDir, decodeURIComponent(filename)) });
    } else {
      return currentDocumentUri.with({ path: path.join(baseDir, decodeURIComponent(ref)) });
    }
  }
}

export async function refToLocation(
  ref: string,
  currentDocumentUri: vscode.Uri,
  cache: Cache,
  externalRefProvider: ExternalRefDocumentProvider
): Promise<vscode.Location | undefined> {
  if (ref.includes("#")) {
    // reference to a file and an JSON pointer
    const [, pointer] = ref.split("#", 2);
    const refUri = refToUri(ref, currentDocumentUri);
    const refDocument = await vscode.workspace.openTextDocument(refUri);
    // in case of external http(s) urls set language id
    const languageId = externalRefProvider.getLanguageId(refUri);
    if (languageId) {
      await vscode.languages.setTextDocumentLanguage(refDocument, languageId);
    }

    const root = cache.getParsedDocument(refDocument);

    if (root) {
      const target = find(root, pointer);
      if (target !== undefined) {
        const location = findLocationForJsonPointer(root, pointer)?.value;
        if (location) {
          return new vscode.Location(
            refDocument.uri,
            new vscode.Range(
              refDocument.positionAt(location.start),
              refDocument.positionAt(location.end)
            )
          );
        }
      }
    }
  } else {
    // the entire file is referenced
    const refUri = refToUri(ref, currentDocumentUri);
    const refDocument = await vscode.workspace.openTextDocument(refUri);
    return new vscode.Location(refDocument.uri, new vscode.Range(0, 0, 0, 0));
  }
}

export class JsonSchemaDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private cache: Cache, private externalRefProvider: ExternalRefDocumentProvider) {}

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | undefined> {
    const offset = document.offsetAt(position);
    const location = json.getLocation(document.getText(), offset);
    const last = location.path[location.path.length - 1];
    const pnode = location.previousNode;
    if (last === "$ref" && pnode && pnode.type === "string") {
      return refToLocation(pnode.value, document.uri, this.cache, this.externalRefProvider);
    }
    return undefined;
  }
}

function extractRef(parsed: any): any {
  for (const [name, value] of Object.entries(parsed)) {
    if (name === "$ref") {
      return value;
    } else if (typeof value === "object" && value !== null) {
      const nested = extractRef(value);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

const refRegex = new RegExp("\\$ref\\s*:\\s+([\\S]+)");

export class YamlSchemaDefinitionProvider implements vscode.DefinitionProvider {
  constructor(
    private cache: Cache,
    private externalRefProvider: ExternalRefDocumentProvider,
    private parserOptions: ParserOptions
  ) {}

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | undefined> {
    const line = document.lineAt(position.line);
    if (line.text.match(refRegex)) {
      const [node, errors] = parse(line.text, "yaml", this.parserOptions);
      const ref = extractRef(node);
      return refToLocation(ref, document.uri, this.cache, this.externalRefProvider);
    }
    return Promise.resolve(undefined);
  }
}
