/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as yaml from "js-yaml";
import { configuration } from "../../configuration";
import { DataDictionaryWebView } from "./view";
import { PlatformContext } from "../types";
import { find, joinJsonPointer, parseJsonPointer, Path } from "@xliic/preserving-json-yaml-parser";
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

  dataDictionaryPreAuditBulkUpdateProperties: async (documentUri: vscode.Uri) => {
    const hasDiagnostics = dataDictionaryDiagnostics.has(documentUri);
    if (hasDiagnostics) {
      const fix = await shouldFixDataDictionaryErrros();
      if (fix === "cancel") {
        return false;
      } else if (fix === "skip") {
        return true;
      }
      const editor = await vscode.window.showTextDocument(documentUri);
      await editorBulkUpdate(store, cache, dataDictionaryDiagnostics, editor);
    }
    return true;
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
  ) => editorBulkUpdate(store, cache, dataDictionaryDiagnostics, editor),
});

const schemaProps = [
  "type",
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

async function shouldFixDataDictionaryErrros(): Promise<"fix" | "skip" | "cancel"> {
  const config = configuration.get<"ask" | "always" | "never">("dataDictionaryPreAuditFix");
  if (config === "ask") {
    const choice = await vscode.window.showInformationMessage(
      "Found Data Dictionary mismatch, update the document with Data Dictionary properties?",
      { modal: true },
      { title: "Yes, update", id: "fix" },
      { title: "No, don't update", id: "skip" },
      { title: "Always update", id: "always" },
      { title: "Never update", id: "never" }
    );
    if (choice === undefined) {
      return "cancel";
    } else if (choice.id === "always" || choice.id === "never") {
      configuration.update("dataDictionaryPreAuditFix", choice.id);
    }
    if (choice.id === "fix") {
      return "fix";
    } else if (choice.id == "always") {
      return "fix";
    } else {
      return "skip";
    }
  }

  return config === "always" ? "fix" : "skip";
}

async function editorBulkUpdate(
  store: PlatformStore,
  cache: Cache,
  dataDictionaryDiagnostics: vscode.DiagnosticCollection,
  editor: vscode.TextEditor
) {
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
    if (
      diagnostic["id"] === "data-dictionary-format-property-mismatch" ||
      diagnostic["id"] === "data-dictionary-format-property-missing"
    ) {
      const format = formats.get(diagnostic.format);
      const pointer = joinJsonPointer(diagnostic.path);
      if (format && !addMissingProperties.has(pointer)) {
        addMissingProperties.set(pointer, format);
      }
    }
  }

  // update every node with missing properties
  for (const [pointer, format] of addMissingProperties) {
    const node = find(parsed, pointer);
    if (node) {
      const updated: any = { ...node };
      for (const name of schemaProps) {
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
}
