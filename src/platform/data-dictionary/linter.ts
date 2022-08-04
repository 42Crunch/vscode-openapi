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
      if (key === "format" && typeof value === "string") {
        diagnostics.push(
          ...checkFormat(
            document,
            parsed,
            formats,
            value,
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
  container: any,
  path: Path
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  if (!formats.has(format)) {
    const range = getValueRange(document, container, "format");
    if (range !== undefined) {
      diagnostics.push({
        message: `Data Dictionary format '${format}' is not defined`,
        range,
        severity: vscode.DiagnosticSeverity.Error,
        source: "vscode-openapi",
      });
      return diagnostics;
    }
  }

  const { format: dataFormat, id: formatId } = formats.get(format)!;
  // check x-42c-format
  if (container.hasOwnProperty("x-42c-format")) {
    if (container["x-42c-format"] !== formatId) {
      const range = getValueRange(document, container, "x-42c-format");
      if (range !== undefined) {
        // check if its the same as format it
        const diagnostic: DataDictionaryDiagnostic = {
          id: "data-dictionary-format-property-mismatch",
          message: `Data Dictionary requires value of '${formatId}'`,
          range,
          severity: vscode.DiagnosticSeverity.Error,
          source: "vscode-openapi",
          path,
          node: container,
          property: "x-42c-format",
          format,
        };
        diagnostics.push(diagnostic);
      }
    }
  } else {
    // no x42c-format
    const range = getParentKeyRange(document, root, path);
    if (range) {
      const diagnostic: DataDictionaryDiagnostic = {
        id: "data-dictionary-format-property-missing",
        message: `Missing "x-42c-format" property required for data dictionary`,
        range,
        severity: vscode.DiagnosticSeverity.Information,
        source: "vscode-openapi",
        path,
        node: container,
        property: "x-42c-format",
        format,
      };
      diagnostics.push(diagnostic);
    }
  }

  for (const prop of schemaProps) {
    if (dataFormat.hasOwnProperty(prop)) {
      if (container.hasOwnProperty(prop)) {
        // properties differ
        if (container[prop] !== (dataFormat as any)[prop]) {
          const range = getValueRange(document, container, prop);
          if (range !== undefined) {
            const diagnostic: DataDictionaryDiagnostic = {
              id: "data-dictionary-format-property-mismatch",
              message: `Data Dictionary requires value of '${(dataFormat as any)[prop]}'`,
              range,
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
        const range = getParentKeyRange(document, root, path);
        if (range !== undefined) {
          const diagnostic: DataDictionaryDiagnostic = {
            id: "data-dictionary-format-property-missing",
            message: `Missing "${prop}" property defined in Data Dictionary`,
            range,
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

function getValueRange(
  document: vscode.TextDocument,
  container: any,
  key: string
): vscode.Range | undefined {
  const location = getLocation(container, key);
  if (location !== undefined) {
    return new vscode.Range(
      document.positionAt(location.value.start),
      document.positionAt(location.value.end)
    );
  }
}

function getParentKeyRange(
  document: vscode.TextDocument,
  root: Parsed,
  path: Path
): vscode.Range | undefined {
  const location = findLocationForPath(root, path);
  if (location !== undefined && location.key !== undefined) {
    return new vscode.Range(
      document.positionAt(location.key.start),
      document.positionAt(location.key.end)
    );
  }
}