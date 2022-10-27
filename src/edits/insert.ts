/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Parsed, Path } from "@xliic/preserving-json-yaml-parser";
import { indent } from "./indent";
import { findLocationForPath, Location } from "@xliic/preserving-json-yaml-parser";

export function insert(
  document: vscode.TextDocument,
  root: Parsed,
  path: Path,
  insertion: string,
  emptyParentNode: boolean
): vscode.TextEdit {
  const location = findLocationForPath(root, path);
  if (location === undefined) {
    throw new Error(`Unable to replace, node at JSON Pointer ${path} is not found`);
  }

  const insertionPosition = findInsertionPosition(document, location);
  const indentPosition = findIndentPosition(document, location);
  const reindented = indent(document, indentPosition, insertion);

  return vscode.TextEdit.insert(
    insertionPosition,
    formatInsertion(document, reindented, emptyParentNode)
  );
}

function formatInsertion(
  document: vscode.TextDocument,
  insertion: string,
  emptyParentNode: boolean
): string {
  if (document.languageId === "yaml") {
    return `\n${insertion}`;
  }
  if (emptyParentNode) {
    return `\n${insertion}`;
  }
  return `,\n${insertion}`;
}

function findInsertionPosition(document: vscode.TextDocument, location: Location) {
  const position = document.positionAt(location.value.end);
  if (document.languageId === "yaml") {
    return position;
  }
  const line = document.lineAt(position.line - 1);
  return line.range.end;
}

function findIndentPosition(document: vscode.TextDocument, location: Location) {
  if (document.languageId === "yaml") {
    return document.positionAt(location.value.start);
  }
  const position = document.positionAt(location.value.end - 1);
  return new vscode.Position(position.line - 1, position.character);
}
