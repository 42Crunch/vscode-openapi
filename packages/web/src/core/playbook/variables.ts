import { LookupFailure, LookupResult, ReplacementResult } from "@xliic/common/env";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { PlaybookEnvStack, lookup } from "./playbook-env";

export const ENV_VAR_NAME_REGEX = /^([\w\-]+)$/;
export const ENV_VAR_NAME_REGEX_MESSAGE = "Only the alphanumeric characters, minus or underscore";

export const ENV_VAR_REGEX = /{{([\w\-$]+)}}/;
export const ENTIRE_ENV_VAR_REGEX = /^{{([\w\-$]+)}}$/;

export function replaceEnvVariables<T>(value: T, envStack: PlaybookEnvStack): ReplacementResult<T> {
  const missing: LookupFailure[] = [];
  const found: LookupResult[] = [];

  // TODO we should report json pointer location of the missing/found variables
  // when doing replacements with simpleClone()
  const replaced = simpleClone(value, (value) => {
    if (typeof value === "string") {
      const replaced = replaceEnv(value, envStack);
      missing.push(...replaced.missing);
      found.push(...replaced.found);
      return replaced.value;
    }
    return value;
  });

  return {
    missing,
    found,
    value: replaced,
  };
}

export function replaceEnv(value: string, envStack: PlaybookEnvStack): ReplacementResult<unknown> {
  const missing: string[] = [];
  const found: LookupResult[] = [];

  // ENTIRE_ENV_VAR_REGEX replaces entire value, possibly changing its type
  const matches = value.match(ENTIRE_ENV_VAR_REGEX);
  if (matches && matches.length === 2) {
    const name = matches[1];
    const result = lookup(envStack, name);
    if (result === undefined) {
      missing.push(name);
      return { found, missing, value };
    } else {
      found.push({ ...result, offset: matches.index! });
    }
    return { found, missing, value: result.value };
  }

  // ENV_VAR_REGEX replaces part of a string value matched, resulting value is always a string
  const result = value.replace(
    ENV_VAR_REGEX,
    (match: string, name: string, offset: number): string => {
      const result = lookup(envStack, name);
      if (result === undefined) {
        missing.push(name);
        return match;
      }
      found.push({ ...result, offset });
      return `${result.value}`;
    }
  );

  return {
    found,
    missing,
    value: result,
  };
}
