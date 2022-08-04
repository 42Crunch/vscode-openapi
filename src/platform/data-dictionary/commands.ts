/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { DataDictionaryWebView } from "./view";
import { PlatformContext } from "../types";
import { find, joinJsonPointer, parseJsonPointer, Path } from "@xliic/preserving-json-yaml-parser";
import { Cache } from "../../cache";
import { replaceObject } from "../../edits/replace";
import { DataDictionaryFormat, PlatformStore } from "../stores/platform-store";
import { DataDictionaryDiagnostic } from "../../types";
import { DataFormat } from "../../../packages/common/src/data-dictionary";

export default (
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  dataDictionaryView: DataDictionaryWebView,
  dataDictionaryDiagnostics: vscode.DiagnosticCollection
) => ({
  browseDataDictionaries: async () => {
    const formats = await store.getDataDictionaries();
    await dataDictionaryView.show();
    dataDictionaryView.sendShowDictionaries(formats);
  },

  editorDataDictionaryUpdateAllProperties: async (
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    format: string,
    node: object,
    nodePath: Path
  ) => {
    const document = editor.document;
    const parsed = cache.getParsedDocument(editor.document);
    const formats = await store.getDataDictionaryFormats();
    const found = formats.filter((f) => f.name === format).pop();

    if (parsed !== undefined && found !== undefined) {
      const updated: any = { ...node };
      for (const name of schemaProps) {
        delete updated[name];
        if ((found.format as any)[name] !== undefined) {
          updated[name] = (found.format as any)[name];
        }
      }
      updated["x-42c-format"] = found.id;

      let text = "";
      if (editor.document.languageId === "yaml") {
        text = yaml.dump(updated, { indent: 2 }).trimEnd();
      } else {
        text = JSON.stringify(updated, null, 1);
      }

      const edit = replaceObject(editor.document, parsed, nodePath, text);
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.set(document.uri, [edit]);
      await vscode.workspace.applyEdit(workspaceEdit);
    }
  },

  editorDataDictionaryUpdateProperty: async (
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    format: string,
    node: object,
    property: string,
    nodePath: Path
  ) => {
    const document = editor.document;
    const parsed = cache.getParsedDocument(editor.document);
    const formats = await store.getDataDictionaryFormats();
    const found = formats.filter((f) => f.name === format).pop();

    let updated: any;
    if (parsed !== undefined && found !== undefined) {
      if (property === "x-42c-format") {
        updated = { ...node, "x-42c-format": found.id };
      } else {
        updated = { ...node, [property]: (found.format as any)[property] };
      }

      let text = "";
      if (editor.document.languageId === "yaml") {
        text = yaml.dump(updated, { indent: 2 }).trimEnd();
      } else {
        text = JSON.stringify(updated, null, 1);
      }

      const edit = replaceObject(editor.document, parsed, nodePath, text);
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.set(document.uri, [edit]);
      await vscode.workspace.applyEdit(workspaceEdit);
    }
  },

  editorDataDictionaryBulkUpdateProperties: async (
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit
  ) => {
    const document = editor.document;
    const parsed = cache.getParsedDocument(editor.document);

    if (parsed === undefined) {
      return;
    }

    const formats: Map<string, DataDictionaryFormat> = new Map();
    for (const format of await store.getDataDictionaryFormats()) {
      formats.set(format.name, format);
    }

    const addMissingProperties = new Map<string, DataDictionaryFormat>();
    const edits: vscode.TextEdit[] = [];
    const diagnostics = dataDictionaryDiagnostics.get(document.uri) || [];
    // find all nodes with missing properties
    for (const diagnostic of diagnostics as DataDictionaryDiagnostic[]) {
      const format = formats.get(diagnostic.format);
      const pointer = joinJsonPointer(diagnostic.path);
      if (
        (diagnostic["id"] === "data-dictionary-format-property-mismatch" ||
          diagnostic["id"] === "data-dictionary-format-property-missing") &&
        format &&
        !addMissingProperties.has(pointer)
      ) {
        addMissingProperties.set(pointer, format);
      }
    }

    // update every node with missing properties
    for (const [pointer, format] of addMissingProperties) {
      const node = find(parsed, pointer);
      if (node) {
        const updated: any = { ...node };
        for (const name of schemaProps) {
          delete updated[name];
          if ((format.format as any)[name] !== undefined) {
            updated[name] = (format.format as any)[name];
          }
        }
        updated["x-42c-format"] = format.id;
        let text = "";
        if (editor.document.languageId === "yaml") {
          text = yaml.dump(updated, { indent: 2 }).trimEnd();
        } else {
          text = JSON.stringify(updated, null, 1);
        }
        const edit = replaceObject(editor.document, parsed, parseJsonPointer(pointer), text);
        edits.push(edit);
      }
    }

    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);
  },
});

const schemaProps = [
  "type",
  "format",
  "example",
  "pattern",
  "minLength",
  "maxLength",
  "enum",
  "default",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minimum",
  "maximum",
  "multipleOf",
];
