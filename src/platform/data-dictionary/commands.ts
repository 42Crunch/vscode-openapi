/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { DataDictionaryWebView } from "./view";
import { PlatformContext } from "../types";
import { Path } from "@xliic/preserving-json-yaml-parser";
import { Cache } from "../../cache";
import { replaceObject } from "../../edits/replace";
import { DataDictionaryFormat, PlatformStore } from "../stores/platform-store";
import { DataDictionaryDiagnostic } from "../../types";

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

    if (parsed !== undefined && found !== undefined) {
      const updated: any = { ...node, [property]: (found.format as any)[property] };

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

    const diagnostics = dataDictionaryDiagnostics.get(document.uri) || [];
    const edits: vscode.TextEdit[] = [];
    for (const diagnostic of diagnostics as DataDictionaryDiagnostic[]) {
      if (diagnostic["id"] === "data-dictionary-format-property-mismatch") {
        const value = (formats.get(diagnostic.format)!.format as any)[diagnostic.property];
        const updated: any = {
          ...diagnostic.node,
          [diagnostic.property]: value,
        };

        let text = "";
        if (editor.document.languageId === "yaml") {
          text = yaml.dump(updated, { indent: 2 }).trimEnd();
        } else {
          text = JSON.stringify(updated, null, 1);
        }
        const edit = replaceObject(editor.document, parsed, diagnostic.path, text);
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
  "readOnly",
  "writeOnly",
  "nullable",
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
