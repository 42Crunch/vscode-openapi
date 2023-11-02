// @ts-nocheck
import { posix } from "path";
import * as vscode from "vscode";
import { findMapping } from "../bundler";
import { parseJsonPointer } from "../pointer";
import { walk } from "../util/extract";

import {
  Fix,
  FixParameter,
  Issue,
  FixParameterSource,
  OpenApiVersion,
  BundleResult,
  Mapping,
} from "../types";

function securitySchemes(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  version: OpenApiVersion,
  bundle: BundleResult,
  document: vscode.TextDocument,
  formatMap?: Map<string, DataDictionaryFormat>
): any[] {
  if ("errors" in bundle) {
    return [];
  }

  if (version !== OpenApiVersion.Unknown && bundle.value) {
    if (version === OpenApiVersion.V2 && bundle.value?.securityDefinitions) {
      return Object.keys(bundle.value.securityDefinitions);
    } else if (version === OpenApiVersion.V3 && bundle.value?.components?.securitySchemes) {
      return Object.keys(bundle.value.components.securitySchemes);
    }
  }

  return [];
}

function mostUsedByName(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  version: OpenApiVersion,
  bundle: BundleResult,
  document: vscode.TextDocument,
  formatMap?: Map<string, DataDictionaryFormat>
): any[] {
  const issuePointer = parseJsonPointer(issue.pointer);
  const parameterPointer = parseJsonPointer(parameter.path);
  const name = issuePointer[issuePointer.length - 1];
  const property = parameterPointer[parameterPointer.length - 1];
  if (usePropertyHints(issuePointer, property) || !formatMap || formatMap.size === 0) {
    return getPropertyHints(bundle, name, property);
  }
  let container = bundle.value;
  for (const segment of issuePointer) {
    if (container) {
      container = container[segment];
    }
  }
  const format = container?.format;
  if (!format || !formatMap.has(format)) {
    return getPropertyHints(bundle, name, property);
  }
  const { format: dataFormat } = formatMap.get(format)!;
  if (!dataFormat.hasOwnProperty(property)) {
    return getPropertyHints(bundle, name, property);
  }
  return [(dataFormat as any)[property]];
}

function usePropertyHints(path: string[], property: string): boolean {
  return (
    property === "example" ||
    property === "x-42c-sample" ||
    property === "format" ||
    path.includes("example") ||
    path.includes("examples") ||
    path.includes("x-42c-sample")
  );
}

function getPropertyHints(bundle: BundleResult, name: string, property: string): any[] {
  const propertyHints = buildPropertyHints(bundle);
  if (propertyHints[name] && propertyHints[name][property] !== undefined) {
    return [propertyHints[name][property]];
  }
  return [];
}

function relativeReference(base: vscode.Uri, mapping: Mapping) {
  const target = vscode.Uri.parse(mapping.uri);
  const hash = mapping.hash === "#" ? "" : mapping.hash;
  if (base.scheme !== target.scheme || base.authority !== target.authority) {
    return `${mapping.uri}${hash}`;
  }
  const relative = posix.relative(posix.dirname(base.path), target.path);
  return `${relative}${hash}`;
}

function schemaRefByResponseCode(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  version: OpenApiVersion,
  bundle: BundleResult,
  document: vscode.TextDocument,
  formatMap?: Map<string, DataDictionaryFormat>
): any[] {
  const schemaRefs = buildSchemaRefByResponseCode(version, bundle);
  // FIXME maybe should account for fix.path?
  const path = [...parseJsonPointer(issue.pointer), ...parseJsonPointer(parameter.path)].reverse();
  const code = version === OpenApiVersion.V2 ? path[2] : path[4];
  if (code && schemaRefs[code]) {
    const mapping = schemaRefs[code];
    return [relativeReference(document.uri, mapping)];
  }
  return [];
}

function buildSchemaRefByResponseCode(version: OpenApiVersion, bundled: BundleResult): any {
  if ("errors" in bundled) {
    return [];
  }

  const hints = {};
  const paths = bundled.value["paths"] ?? {};
  for (const path of Object.keys(paths)) {
    for (const operation of Object.values(paths[path])) {
      const responses = operation["responses"] ?? {};
      for (const [code, response] of Object.entries(responses)) {
        const ref =
          version == OpenApiVersion.V2
            ? response?.["schema"]?.["$ref"]
            : response?.["content"]?.["application/json"]?.["schema"]?.["$ref"];
        if (ref) {
          const mapping = findMapping(bundled.mapping, ref) || {
            uri: bundled.mapping.value.uri,
            hash: ref,
          };
          if (!hints[code]) {
            hints[code] = [];
          }
          hints[code].push(mapping);
        }
      }
    }
  }

  for (const code of Object.keys(hints)) {
    hints[code] = mode(hints[code]);
  }

  return hints;
}

function buildPropertyHints(bundled: BundleResult): any {
  const hints = {};

  // TODO: boost perfomance
  if (!("errors" in bundled)) {
    walk(bundled, null, [], (parent, path, key, value) => {
      // TODO check items for arrays
      if (path.length > 3 && path[1] === "properties") {
        const property = path[0];
        if (!hints[property]) {
          hints[property] = {};
        }
        if (!hints[property][key]) {
          hints[property][key] = [];
        }
        hints[property][key].push(value);
      }
    });

    // update hints replacing arrays of occurences of values
    // with most frequent value in the array
    for (const property of Object.keys(hints)) {
      for (const key of Object.keys(hints[property])) {
        hints[property][key] = mode(hints[property][key]);
      }
    }
  }

  return hints;
}

function mode(arr) {
  return arr
    .sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length)
    .pop();
}

const SOURCES: { [name: string]: FixParameterSource } = {
  securitySchemes,
  mostUsedByName,
  schemaRefByResponseCode,
};

export default SOURCES;
