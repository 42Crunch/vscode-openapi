import jsf from "json-schema-faker";

import { LookupFailure, LookupResult, ReplacementResult } from "@xliic/common/env";
import { BundledOpenApiSpec, OasOperation } from "@xliic/common/oas30";
import * as playbook from "@xliic/common/playbook";
import { SwaggerOperation } from "@xliic/common/swagger";
import { Path, findByPath, simpleClone } from "@xliic/preserving-json-yaml-parser";
import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import { deref } from "@xliic/common/ref";
import { HttpMethod } from "@xliic/common/http";

import { EnvStackLookupResult, PlaybookEnvStack, lookup } from "./playbook-env";
import {
  DynamicVariableName,
  DynamicVariableNames,
  DynamicVariables,
  FakeMaker,
} from "./builtin-variables";
import {
  generateParameterValues as generateOasParameterValues,
  getParameters as getOasParameters,
} from "../../util";
import {
  generateParameterValues as generateSwaggerParameterValues,
  getParameters as getSwaggerParameters,
} from "../../util-swagger";

export const ENV_VAR_NAME_REGEX = () => /^([\w\-]+)$/g;
export const ENV_VAR_NAME_REGEX_MESSAGE = "Only the alphanumeric characters, minus or underscore";

export const ENV_VAR_REGEX = () => /{{([\w\-$]+)}}/g;
export const ENTIRE_ENV_VAR_REGEX = () => /^{{([\w\-$]+)}}$/;

export function replaceEnvironmentVariables(
  environment: playbook.Environment,
  envStack: PlaybookEnvStack
): ReplacementResult<playbook.Environment> {
  return replaceObject(environment, envStack, () => ({ body: undefined, parameters: undefined }));
}

export function replaceRequestVariables(
  oas: BundledSwaggerOrOasSpec,
  request: playbook.CRequest | playbook.ExternalCRequest,
  operation: OasOperation | SwaggerOperation | undefined,
  envStack: PlaybookEnvStack
): ReplacementResult<playbook.CRequest | playbook.ExternalCRequest> {
  let fake: { body: unknown; parameters: unknown };
  const fakeMaker: FakeMaker = (location: Path) => {
    if (fake === undefined) {
      fake = createFake(oas, operation, (request as playbook.CRequest).path, request.method);
    }
    return fake;
  };
  return replaceObject(request, envStack, fakeMaker);
}

export function replaceCredentialVariables(
  credential: string,
  envStack: PlaybookEnvStack
): ReplacementResult<string> {
  return substituteValues(credential, envStack, {}, [], () => ({
    body: undefined,
    parameters: undefined,
  }));
}

function replaceObject<T>(
  object: T,
  envStack: PlaybookEnvStack,
  fakeMaker: FakeMaker
): ReplacementResult<T> {
  const missing: LookupFailure[] = [];
  const found: LookupResult[] = [];

  const replaced = simpleClone(object, (value, location) => {
    if (typeof value === "string") {
      const replaced = replaceString(value, envStack, object, location, fakeMaker);
      missing.push(...replaced.missing);
      found.push(...replaced.found);
      return replaced.value;
    } else {
      return value;
    }
  });

  return {
    missing,
    found,
    value: replaced,
  };
}

function replaceString(
  value: string,
  envStack: PlaybookEnvStack,
  object: unknown,
  location: Path,
  fakeMaker: FakeMaker
): ReplacementResult<unknown> {
  const matches = value.match(ENTIRE_ENV_VAR_REGEX());
  if (matches && matches.length === 2) {
    // ENTIRE_ENV_VAR_REGEX replaces entire value, possibly changing its type
    const name = matches[1];
    return replaceValue(name, value, envStack, object, location, fakeMaker);
  } else {
    // replace parts of the string value, or possibly none at all
    return substituteValues(value, envStack, object, location, fakeMaker);
  }
}

function replaceValue(
  name: string,
  value: string,
  envStack: PlaybookEnvStack,
  object: unknown,
  location: Path,
  fakeMaker: FakeMaker
): ReplacementResult<unknown> {
  const result = lookupOrDynamic(envStack, name, object, location, fakeMaker);
  if (result !== undefined) {
    return { found: [{ ...result, offset: 0, location }], missing: [], value: result.value };
  } else {
    return { found: [], missing: [{ name, location }], value };
  }
}

function substituteValues(
  value: string,
  envStack: PlaybookEnvStack,
  object: unknown,
  location: Path,
  fakeMaker: FakeMaker
): ReplacementResult<string> {
  const missing: LookupFailure[] = [];
  const found: LookupResult[] = [];

  // ENV_VAR_REGEX replaces part of a string value matched, resulting value is always a string
  const result = value.replace(
    ENV_VAR_REGEX(),
    (match: string, name: string, offset: number): string => {
      const result = lookupOrDynamic(envStack, name, object, location, fakeMaker);
      if (result !== undefined) {
        found.push({ ...result, offset, location });
        return `${result.value}`;
      } else {
        missing.push({ name, location });
        return match;
      }
    }
  );

  return {
    found,
    missing,
    value: result,
  };
}

function lookupOrDynamic(
  envStack: PlaybookEnvStack,
  varname: string,
  object: unknown,
  location: Path,
  fakeMaker: (location: Path) => { body: unknown; parameters: unknown }
): EnvStackLookupResult | undefined {
  if (DynamicVariableNames.includes(varname as DynamicVariableName)) {
    const dynamic = DynamicVariables[varname as DynamicVariableName](object, location, fakeMaker);
    return { context: "dynamic", value: dynamic, name: varname };
  } else {
    return lookup(envStack, varname);
  }
}

function createFake(
  oas: BundledSwaggerOrOasSpec,
  operation: OasOperation | SwaggerOperation | undefined,
  path: string,
  method: HttpMethod
): { body: unknown; parameters: unknown } {
  const result: { body: unknown; parameters: unknown } = { body: undefined, parameters: undefined };

  if (operation === undefined) {
    return result;
  }

  if (isOpenapi(oas)) {
    const requestBody = deref(oas, (operation as OasOperation).requestBody);
    const schema = deref(oas, requestBody?.content["application/json"]?.schema);
    if (schema) {
      result.body = generateBody({ ...schema, components: (oas as any).components });
    }
    // create request parameters
    const parameters = getOasParameters(oas, path, method);
    result.parameters = generateOasParameterValues(oas, parameters);
  } else {
    const parameters = getSwaggerParameters(oas, path, method);
    if (parameters.body) {
      const body = Object.values(parameters.body)?.[0];
      const schema = deref(oas, body?.schema);
      if (schema) {
        result.body = generateBody({ ...schema, definitions: oas.definitions });
      }
    }
    // create request parameters
    result.parameters = generateSwaggerParameterValues(oas, parameters);
  }

  return result;
}

function generateBody(schema: any) {
  try {
    jsf.option("useExamplesValue", false);
    jsf.option("failOnInvalidFormat", false);
    jsf.option("maxLength", 4096);
    jsf.option("alwaysFakeOptionals", true);
    return jsf.generate(schema);
  } catch (ex) {
    return undefined;
  }
}

export function getMissingVariableNames(missing: LookupFailure[]): string {
  return missing.map((missing) => missing.name).join(", ");
}
