/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Parsed, Path } from "@xliic/preserving-json-yaml-parser";
import { indent } from "./indent";
import { findLocationForPath } from "@xliic/preserving-json-yaml-parser";

export function replaceLiteral(
  document: vscode.TextDocument,
  root: Parsed,
  path: Path,
  replacement: string
): vscode.TextEdit {
  const location = findLocationForPath(root, path)?.value;
  if (location === undefined) {
    throw new Error(`Unable to perform replace, node at JSON Pointer ${path} is not found`);
  }

  const range = new vscode.Range(
    document.positionAt(location.start),
    document.positionAt(location.end)
  );

  return vscode.TextEdit.replace(range, replacement);
}

export function replaceObject(
  document: vscode.TextDocument,
  root: Parsed,
  path: Path,
  replacement: string
): vscode.TextEdit {
  const location = findLocationForPath(root, path)?.value;
  if (location === undefined) {
    throw new Error(`Unable to replace, node at JSON Pointer ${path} is not found`);
  }

  const range = new vscode.Range(
    document.positionAt(location.start),
    document.positionAt(location.end)
  );

  // reindent replacement to the target indentation level
  // remove spaces at the first line, as the insertion starts
  // at the start of the value, which is already properly indented
  const reindented = indent(document, range.start, replacement).replace(/^\s+/g, "");

  return vscode.TextEdit.replace(range, reindented);
}
