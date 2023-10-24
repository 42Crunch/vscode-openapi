import jsf from "json-schema-faker";

import { LookupFailure, LookupResult, ReplacementResult } from "@xliic/common/env";
import { OasOperation } from "@xliic/common/oas30";
import * as playbook from "@xliic/common/playbook";
import { SwaggerOperation } from "@xliic/common/swagger";
import { Path, simpleClone } from "@xliic/preserving-json-yaml-parser";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { deref } from "@xliic/common/ref";

import { EnvStackLookupResult, PlaybookEnvStack, lookup } from "./playbook-env";
import { DynamicVariableName, DynamicVariableNames, DynamicVariables } from "./builtin-variables";

export const ENV_VAR_NAME_REGEX = () => /^([\w\-]+)$/g;
export const ENV_VAR_NAME_REGEX_MESSAGE = "Only the alphanumeric characters, minus or underscore";

export const ENV_VAR_REGEX = () => /{{([\w\-$]+)}}/g;
export const ENTIRE_ENV_VAR_REGEX = () => /^{{([\w\-$]+)}}$/;

export function replaceEnvironmentVariables(
  environment: playbook.Environment,
  envStack: PlaybookEnvStack
): ReplacementResult<playbook.Environment> {
  return replaceObject(environment, envStack, () => undefined);
}

export function replaceRequestVariables(
  oas: BundledSwaggerOrOasSpec,
  request: playbook.CRequest | playbook.ExternalCRequest,
  operation: OasOperation | SwaggerOperation | undefined,
  envStack: PlaybookEnvStack
): ReplacementResult<playbook.CRequest | playbook.ExternalCRequest> {
  let fake: unknown;

  const fakerMaker = (location: Path) => {
    // only fake the body for now
    console.log("making fake for", location);
    if (location?.[0] === "body" && location?.[1] === "value") {
      if (!fake) {
        fake = createFake(oas, operation);
      }
      return fake;
    }
    return undefined;
  };

  return replaceObject(request, envStack, fakerMaker);
}

export function replaceCredentialVariables(
  credential: string,
  envStack: PlaybookEnvStack
): ReplacementResult<string> {
  return replaceString(credential, envStack, [], () => undefined);
}

function replaceObject<T>(
  value: T,
  envStack: PlaybookEnvStack,
  fakerMaker: (location: Path) => unknown
): ReplacementResult<T> {
  const missing: LookupFailure[] = [];
  const found: LookupResult[] = [];

  const replaced = simpleClone(value, (value, location) => {
    if (typeof value === "string") {
      const replaced = replaceStringOrMore(value, envStack, location, fakerMaker);

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

function replaceStringOrMore(
  value: string,
  envStack: PlaybookEnvStack,
  location: Path,
  fakerMaker: (location: Path) => unknown
): ReplacementResult<unknown> {
  const missing: LookupFailure[] = [];
  const found: LookupResult[] = [];

  // ENTIRE_ENV_VAR_REGEX replaces entire value, possibly changing its type
  const matches = value.match(ENTIRE_ENV_VAR_REGEX());
  if (matches && matches.length === 2) {
    const name = matches[1];
    const result = findDynamicOrLookup(envStack, name, location, fakerMaker);
    if (result !== undefined) {
      found.push({ ...result, offset: matches.index!, location });
      return { found, missing, value: result.value };
    } else {
      missing.push({ name, location });
      return { found, missing, value };
    }
  } else {
    return replaceString(value, envStack, location, fakerMaker);
  }
}

function replaceString(
  value: string,
  envStack: PlaybookEnvStack,
  location: Path,
  fakerMaker: (location: Path) => unknown
): ReplacementResult<string> {
  const missing: LookupFailure[] = [];
  const found: LookupResult[] = [];

  // ENV_VAR_REGEX replaces part of a string value matched, resulting value is always a string
  const result = value.replace(
    ENV_VAR_REGEX(),
    (match: string, name: string, offset: number): string => {
      const result = findDynamicOrLookup(envStack, name, location, fakerMaker);
      if (result === undefined) {
        missing.push({ name, location });
        return match;
      }
      found.push({ ...result, offset, location });
      return `${result.value}`;
    }
  );

  return {
    found,
    missing,
    value: result,
  };
}

function findDynamicOrLookup(
  envStack: PlaybookEnvStack,
  varname: string,
  location: Path,
  fakerMaker: (location: Path) => unknown
): EnvStackLookupResult | undefined {
  if (DynamicVariableNames.includes(varname as DynamicVariableName)) {
    const dynamic = DynamicVariables[varname as DynamicVariableName](location, fakerMaker);
    return { context: "dynamic", value: dynamic, name: varname };
  }

  return lookup(envStack, varname);
}

function createFake(
  oas: BundledSwaggerOrOasSpec,
  operation: OasOperation | SwaggerOperation | undefined
) {
  if (operation !== undefined && "requestBody" in operation) {
    const requestBody = deref(oas, operation.requestBody);
    const schema = deref(oas, requestBody?.content["application/json"]?.schema);
    if (schema) {
      try {
        jsf.option("useExamplesValue", false);
        jsf.option("failOnInvalidFormat", false);
        jsf.option("maxLength", 4096);
        jsf.option("alwaysFakeOptionals", true);
        const generated = jsf.generate({ ...schema, components: (oas as any).components } as any);
        return generated;
      } catch (e) {
        console.log("failed to generate", e);
        return undefined;
      }
    }
  }
}
