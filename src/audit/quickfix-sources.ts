import { parseJsonPointer } from "../pointer";
import { CacheEntry, Fix, FixParameter, Issue, FixParameterSource, OpenApiVersion } from "../types";

function securitySchemes(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  entry: CacheEntry
): any[] {
  const { version, bundle } = entry;

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

function mostUsedByName(issue: Issue, fix: Fix, parameter: FixParameter, entry: CacheEntry): any[] {
  const issuePointer = parseJsonPointer(issue.pointer);
  const parameterPointer = parseJsonPointer(parameter.path);
  const name = issuePointer[issuePointer.length - 1];
  const property = parameterPointer[parameterPointer.length - 1];
  if (entry.propertyHints[name] && entry.propertyHints[name][property]) {
    return [entry.propertyHints[name][property]];
  }

  return [];
}

const SOURCES: { [name: string]: FixParameterSource } = { securitySchemes, mostUsedByName };

export default SOURCES;
