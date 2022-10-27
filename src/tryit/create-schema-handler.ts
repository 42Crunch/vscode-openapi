/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { findLocationForPath } from "@xliic/preserving-json-yaml-parser";

import { insert } from "../edits/insert";
import { generateSchema } from "../audit/schema";
import { Cache } from "../cache";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";

export async function executeCreateSchemaRequest(
  document: vscode.TextDocument,
  cache: Cache,
  payload: any
): Promise<void> {
  const parsed = cache.getParsedDocument(document) as any;
  const version = getOpenApiVersion(parsed);

  if (version === OpenApiVersion.Unknown) {
    return;
  }

  const path = version === OpenApiVersion.V3 ? ["components", "schemas"] : ["definitions"];

  let emptyInsertionLocation = Object.keys(parsed).length === 0;
  let traversed = 0;
  let current = parsed;
  for (const name of path) {
    if (current[name] !== undefined) {
      current = current[name];
      emptyInsertionLocation = Object.keys(current).length === 0;
      traversed++;
    }
  }

  const schemaNames = new Set<string>(traversed == path.length ? Object.keys(current) : []);

  // focus the document
  await vscode.workspace.openTextDocument(document.uri);

  const schemaName = await vscode.window.showInputBox({
    value: getUniqueSchemaName(schemaNames),
    prompt: "Enter new schema name.",
    validateInput: (value) => (!schemaNames.has(value) ? null : "Please enter unique schema name"),
  });

  if (!schemaName) {
    return;
  }

  let schema: any = { [schemaName]: generateSchema(payload) };
  const schemaInsertLocation = path.slice(0, traversed);
  const wrap = path.slice(traversed, path.length).reverse();

  for (const name of wrap) {
    schema = { [name]: schema };
  }

  let text = "";
  if (document.languageId === "yaml") {
    text = yaml.dump(schema, { indent: 1 }).trimEnd();
  } else {
    text = JSON.stringify(schema, null, 1);
    text = text.substring(2, text.length - 2);
    text = text.replace(new RegExp("^\\s", "mg"), "");
  }

  const edit = insert(document, parsed, schemaInsertLocation, text, emptyInsertionLocation);

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, [edit]);
  await vscode.workspace.applyEdit(workspaceEdit);

  const parsed2 = cache.getParsedDocument(document);
  if (!parsed2) {
    return;
  }

  const location2 = findLocationForPath(parsed2, [...path, schemaName]);
  const start = document.positionAt(location2!.key!.start);
  const end = document.positionAt(location2!.value.end);

  const editor = await focusEditor(document);
  editor!.selection = new vscode.Selection(start, end);
  editor!.revealRange(editor!.selection, vscode.TextEditorRevealType.AtTop);
}

async function focusEditor(document: vscode.TextDocument): Promise<vscode.TextEditor> {
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.uri.toString() === document.uri.toString()) {
      return editor;
    }
  }
  return vscode.window.showTextDocument(document);
}

function getUniqueSchemaName(schemaNames: Set<string>): string {
  const result = "GeneratedSchemaName";
  for (let index = 1; index < 1000; index++) {
    const newName = result + index;
    if (!schemaNames.has(newName)) {
      return newName;
    }
  }
  return "";
}
