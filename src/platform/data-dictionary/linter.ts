/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { PlatformContext } from "../types";
import {
  Location,
  Parsed,
  getLocation,
  Path,
  findLocationForPath,
} from "@xliic/preserving-json-yaml-parser";
import { visitObject } from "@xliic/preserving-json-yaml-parser/lib/visit/object";

import { Cache } from "../../cache";
import { DataDictionaryFormat, PlatformStore } from "../stores/platform-store";
import { DataDictionaryDiagnostic } from "../../types";

export function activate(
  cache: Cache,
  platformContext: PlatformContext,
  store: PlatformStore,
  collection: vscode.DiagnosticCollection
): void {
  cache.onDidActiveDocumentChange(async (document) => {
    if (document === undefined) {
      return;
    }
    const formats = await store.getDataDictionaryFormats();
    const formatMap = new Map<string, DataDictionaryFormat>();
    for (const format of formats) {
      formatMap.set(format.name, format);
    }
    const parsed = cache.getParsedDocument(document);
    if (parsed !== undefined) {
      lint(collection, formatMap, document, parsed);
    }
  });
}

function lint(
  collection: vscode.DiagnosticCollection,
  formats: Map<string, DataDictionaryFormat>,
  document: vscode.TextDocument,
  parsed: Parsed
): void {
  const diagnostics: vscode.Diagnostic[] = [];
  const path: Path = [];
  visitObject(undefined, "fakeroot", parsed, {
    onObjectStart: function (
      parent: any,
      key: string | number,
      value: any,
      location: Location | undefined
    ): void {
      path.push(key);
    },
    onObjectEnd: function (): void {
      path.pop();
    },
    onArrayStart: function (
      parent: any,
      key: string | number,
      value: any,
      location: Location | undefined
    ): void {
      path.push(key);
    },
    onArrayEnd: function (): void {
      path.pop();
    },
    onValue: function (
      parent: any,
      key: string | number,
      value: any,
      text: string | undefined,
      location: Location | undefined
    ): void {
      if (key === "x-42c-format" && typeof value === "string" && location?.key !== undefined) {
        const keyRange = new vscode.Range(
          document.positionAt(location.key.start),
          document.positionAt(location.key.end)
        );
        const valueRange = new vscode.Range(
          document.positionAt(location.value.start),
          document.positionAt(location.value.end)
        );
        diagnostics.push(
          ...checkFormat(
            document,
            parsed,
            formats,
            value,
            keyRange,
            valueRange,
            parent,
            path.slice(1) // remove fakeroot
          )
        );
      }
    },
  });
  collection.set(document.uri, diagnostics);
}

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

function checkFormat(
  document: vscode.TextDocument,
  root: Parsed,
  formats: Map<string, DataDictionaryFormat>,
  format: string,
  keyRange: vscode.Range,
  valueRange: vscode.Range,
  container: any,
  path: Path
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!formats.has(format)) {
    diagnostics.push({
      message: `Data Dictionary format '${format}' is not defined`,
      range: valueRange,
      severity: vscode.DiagnosticSeverity.Error,
      source: "vscode-openapi",
    });
    return diagnostics;
  }

  const dataFormat = formats.get(format)!.format;
  for (const prop of schemaProps) {
    if (dataFormat.hasOwnProperty(prop)) {
      if (container.hasOwnProperty(prop)) {
        // properties differ
        if (container[prop] !== (dataFormat as any)[prop]) {
          const location = getLocation(container, prop);
          if (location !== undefined) {
            const valueRange = new vscode.Range(
              document.positionAt(location.value.start),
              document.positionAt(location.value.end)
            );
            const diagnostic: DataDictionaryDiagnostic = {
              id: "data-dictionary-format-property-mismatch",
              message: `Data Dictionary requires value of '${(dataFormat as any)[prop]}'`,
              range: valueRange,
              severity: vscode.DiagnosticSeverity.Error,
              source: "vscode-openapi",
              path,
              node: container,
              property: prop,
              format,
            };
            diagnostics.push(diagnostic);
          }
        }
      } else {
        // property is missing
        const location = findLocationForPath(root, path);
        if (location !== undefined) {
          const valueRange = new vscode.Range(
            document.positionAt(location.key!.start),
            document.positionAt(location.key!.end)
          );
          const diagnostic: DataDictionaryDiagnostic = {
            id: "data-dictionary-format-property-missing",
            message: `Missing "${prop}" property defined in Data Dictionary`,
            range: valueRange,
            severity: vscode.DiagnosticSeverity.Information,
            source: "vscode-openapi",
            path,
            node: container,
            property: prop,
            format,
          };
          diagnostics.push(diagnostic);
        }
      }
    }
  }

  return diagnostics;
}
