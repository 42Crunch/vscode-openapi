import { parseJsonPointer } from "../pointer";
import { CacheEntry, Fix, FixParameter, Issue, FixParameterSource, OpenApiVersion } from "../types";

function securitySchemes(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  entry: CacheEntry
): any[] {
  const { version, bundled } = entry;
  if (version !== OpenApiVersion.Unknown && bundled) {
    if (version === OpenApiVersion.V2 && bundled.securityDefinitions) {
      return Object.keys(bundled.securityDefinitions);
    } else if (version === OpenApiVersion.V3 && bundled.components?.securitySchemes) {
      return Object.keys(bundled.components.securitySchemes);
    }
  }

  return [];
}

function mostUsedByName(issue: Issue, fix: Fix, parameter: FixParameter, entry: CacheEntry): any[] {
  const issuePointer = parseJsonPointer(issue.pointer);
  const parameterPointer = parseJsonPointer(parameter.path);
  const name = issuePointer[issuePointer.length - 1];
  const property = parameterPointer[parameterPointer.length - 1];
  if (entry.propertyHints[name] && entry.propertyHints[name][property]) {
    return [entry.propertyHints[name][property]];
  }

  console.log("mubn", fix, issue, issuePointer, parameterPointer);
  return [];
}

const SOURCES: { [name: string]: FixParameterSource } = { securitySchemes, mostUsedByName };

export default SOURCES;
