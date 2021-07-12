/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as path from "path";
import * as vscode from "vscode";
import * as json from "jsonc-parser";
import * as yaml from "js-yaml";
import { Cache } from "./cache";
import { ExternalRefDocumentProvider, toInternalUri } from "./external-refs";

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
): Promise<vscode.Location> | undefined {
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

    const root = cache.getDocumentAst(refDocument);

    if (root) {
      const target = root.find(pointer);
      if (target) {
        const [start, end] = target.getRange();
        return new vscode.Location(
          refDocument.uri,
          new vscode.Range(refDocument.positionAt(start), refDocument.positionAt(end))
        );
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
  ): Promise<vscode.Location> {
    const offset = document.offsetAt(position);
    const location = json.getLocation(document.getText(), offset);
    const last = location.path[location.path.length - 1];
    const pnode = location.previousNode;
    if (last === "$ref" && pnode && pnode.type === "string") {
      return refToLocation(pnode.value, document.uri, this.cache, this.externalRefProvider);
    }
    return null;
  }
}

function extractRef(parsed: any) {
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
  return null;
}

const refRegex = new RegExp("\\$ref\\s*:\\s+([\\S]+)");

export class YamlSchemaDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private cache: Cache, private externalRefProvider: ExternalRefDocumentProvider) {}

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location> {
    const line = document.lineAt(position.line);
    if (line.text.match(refRegex)) {
      const parsed = yaml.safeLoad(line.text);
      const ref = extractRef(parsed);
      const location = refToLocation(ref, document.uri, this.cache, this.externalRefProvider);
      return location;
    }
    return null;
  }
}
