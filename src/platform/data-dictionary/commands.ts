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
import { DataFormat } from "@xliic/common/data-dictionary";
import { Cache } from "../../cache";
import { replaceObject } from "../../edits/replace";
import { DataDictionaryFormat, PlatformStore } from "../stores/platform-store";
import { DataDictionaryDiagnostic, OpenApiVersion } from "../../types";
import { getOpenApiVersion } from "../../parsers";
import { delay } from "../../time-util";

export default (
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  dataDictionaryView: DataDictionaryWebView,
  dataDictionaryDiagnostics: vscode.DiagnosticCollection
) => ({
  browseDataDictionaries: async () => {
    const formats = await store.getDataDictionaries();
    dataDictionaryView.sendShowDictionaries(formats);
  },

  dataDictionaryPreAuditBulkUpdateProperties: async (documentUri: vscode.Uri): Promise<boolean> => {
    const diagnostics = dataDictionaryDiagnostics.get(documentUri);
    if (diagnostics !== undefined && diagnostics.length > 0) {
      const fix = await shouldFixDataDictionaryErrros();
      if (fix === "cancel") {
        return false;
      } else if (fix === "skip") {
        return true;
      }
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.toString() === documentUri.toString()) {
          await documentBulkUpdate(store, cache, dataDictionaryDiagnostics, editor.document);
          return true;
        }
      }
      // no document updated
      vscode.window.showInformationMessage(
        `Failed to update contents of the ${documentUri} with Data Dictionary properties`
      );
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
      const version = getOpenApiVersion(parsed);

      const updated: any = { ...node };
      for (const name of schemaProps) {
        updatePropertyOfExistingObject(version, nodePath, updated, name, found.format);
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
    const version = getOpenApiVersion(parsed);
    const formats = await store.getDataDictionaryFormats();
    const found = formats.filter((f) => f.name === format).pop();

    const updated: any = { ...node };
    if (parsed !== undefined && found !== undefined) {
      if (property === "x-42c-format") {
        updated["x-42c-format"] = found.id;
      } else {
        updatePropertyOfExistingObject(version, nodePath, updated, property, found.format);
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
  ) => documentBulkUpdate(store, cache, dataDictionaryDiagnostics, editor.document),
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

  await delay(100); // workaround for #133073
  if (config === "ask") {
    const choice = await vscode.window.showInformationMessage(
      "Found Data Dictionary mismatch, update the document with Data Dictionary properties?",
      { modal: true },
      { title: "Update", id: "fix" },
      { title: "Don't update", id: "skip" }
    );

    if (choice?.id === "fix") {
      vscode.window
        .showInformationMessage(
          "Remember your choice and always update document with Data Dictionary properties?",
          { modal: false },
          { title: "Always update", id: "always" },
          { title: "Cancel", id: "cancel" }
        )
        .then((choice) => {
          if (choice?.id === "always") {
            configuration.update(
              "dataDictionaryPreAuditFix",
              "always",
              vscode.ConfigurationTarget.Global
            );
          }
        });
    } else if (choice?.id === "skip") {
      vscode.window
        .showInformationMessage(
          "Remember your choice and never update document with Data Dictionary properties?",
          { modal: false },
          { title: "Never update", id: "never" },
          { title: "Cancel", id: "cancel" }
        )
        .then((choice) => {
          if (choice?.id === "never") {
            configuration.update(
              "dataDictionaryPreAuditFix",
              "never",
              vscode.ConfigurationTarget.Global
            );
          }
        });
    }

    if (choice === undefined) {
      return "cancel";
    }
    if (choice.id === "fix") {
      return "fix";
    } else {
      return "skip";
    }
  }

  return config === "always" ? "fix" : "skip";
}

async function documentBulkUpdate(
  store: PlatformStore,
  cache: Cache,
  dataDictionaryDiagnostics: vscode.DiagnosticCollection,
  document: vscode.TextDocument
) {
  const parsed = cache.getParsedDocument(document);

  if (parsed === undefined) {
    return;
  }

  const version = getOpenApiVersion(parsed);

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
        updatePropertyOfExistingObject(
          version,
          parseJsonPointer(pointer),
          updated,
          name,
          format.format
        );
      }
      updated["x-42c-format"] = format.id;
      let text = "";
      if (document.languageId === "yaml") {
        text = yaml.dump(updated, { indent: 2 }).trimEnd();
      } else {
        text = JSON.stringify(updated, null, 1);
      }
      const edit = replaceObject(document, parsed, parseJsonPointer(pointer), text);
      edits.push(edit);
    }
  }

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, edits);
  await vscode.workspace.applyEdit(workspaceEdit);
}

function updatePropertyOfExistingObject(
  version: OpenApiVersion,
  path: Path,
  existing: any,
  name: string,
  format: DataFormat
) {
  const value = (format as any)[name];

  // skip properties not defined in the format
  if (value === undefined) {
    return;
  }

  if (name !== "example") {
    existing[name] = value;
    return;
  }

  // property name is 'example'

  // dont update already existing examples
  if (existing.hasOwnProperty("example") || existing.hasOwnProperty("x-42c-sample")) {
    return;
  }

  // use 'x-42c-sample' for Swagger2.0 parameter objects
  if (
    version === OpenApiVersion.V2 &&
    !(path.includes("schema") || path.includes("definitions") || path.includes("x-42c-schemas"))
  ) {
    existing["x-42c-sample"] = value;
    return;
  }

  existing["example"] = value;
}
