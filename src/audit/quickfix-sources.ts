import { parseJsonPointer } from "../pointer";
import {
  Fix,
  FixParameter,
  Issue,
  FixParameterSource,
  OpenApiVersion,
  BundleResult,
} from "../types";

function securitySchemes(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  version: OpenApiVersion,
  bundle: BundleResult
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
  bundle: BundleResult
): any[] {
  const propertyHints = buildPropertyHints(bundle);
  const issuePointer = parseJsonPointer(issue.pointer);
  const parameterPointer = parseJsonPointer(parameter.path);
  const name = issuePointer[issuePointer.length - 1];
  const property = parameterPointer[parameterPointer.length - 1];
  if (propertyHints[name] && propertyHints[name][property] !== undefined) {
    return [propertyHints[name][property]];
  }

  return [];
}

function schemaRefByResponseCode(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  version: OpenApiVersion,
  bundle: BundleResult
): any[] {
  const schemaRefs = buildSchemaRefByResponseCode(version, bundle);
  // FIXME maybe should account for fix.path?
  const path = [...parseJsonPointer(issue.pointer), ...parseJsonPointer(parameter.path)].reverse();
  const code = version === OpenApiVersion.V2 ? path[2] : path[4];
  if (code && schemaRefs[code]) {
    return [schemaRefs[code]];
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
          if (!hints[code]) {
            hints[code] = [];
          }
          hints[code].push(ref);
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

function walk(current: any, parent: any, path: string[], visitor: any) {
  for (const key of Object.keys(current)) {
    const value = current[key];
    if (typeof value === "object" && value !== null) {
      walk(value, current, [key, ...path], visitor);
    } else {
      visitor(parent, path, key, value);
    }
  }
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
