import jsf from "json-schema-faker";

import {
  Swagger,
  HttpMethod,
  isOpenapi,
  BundledSwaggerOrOasSpec,
  OpenApi30,
  OpenApi31,
  SecurityRequirement,
} from "@xliic/openapi";
import { Environment } from "@xliic/common/env";
import { Playbook } from "@xliic/scanconf";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { deref } from "@xliic/openapi";
import { Vault } from "@xliic/common/vault";
import { Result } from "@xliic/result";

import {
  PlaybookEnvStack,
  PlaybookVariableSubstitutionLocation,
  PlaybookLookupResult,
  PlaybookLookupFailure,
  PlaybookReplacementResult,
  lookup,
} from "./playbook-env";
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

export const SCANCONF_VAR_REGEX = () => /{{([\w\-$]+)(?::([\w\-]+))?}}/g;
export const ENTIRE_SCANCONF_VAR_REGEX = () => /^{{([\w\-$]+)(?::([\w\-]+))?}}$/;

export function replaceEnvironmentVariables(
  location: "stage-environment" | "request-environment",
  environment: Environment,
  envStack: PlaybookEnvStack
): PlaybookReplacementResult<Environment> {
  return replaceObject(location, environment, envStack, () => ({
    body: undefined,
    parameters: undefined,
  }));
}

export function replaceRequestVariables(
  oas: BundledSwaggerOrOasSpec,
  request: Playbook.CRequest | Playbook.ExternalCRequest,
  operation: OpenApi31.Operation | OpenApi30.Operation | Swagger.Operation | undefined,
  envStack: PlaybookEnvStack
): PlaybookReplacementResult<Playbook.CRequest | Playbook.ExternalCRequest> {
  let fake: { body: unknown; parameters: unknown };
  const fakeMaker: FakeMaker = () => {
    if (fake === undefined) {
      fake = createFake(oas, operation, (request as Playbook.CRequest).path, request.method);
    }
    return fake;
  };
  return replaceObject("request", request, envStack, fakeMaker);
}

export function replaceCredentialVariables(
  credential: Playbook.Credential,
  credentialName: string,
  credentialValue: string,
  security: SecurityRequirement[],
  vault: Vault,
  envStack: PlaybookEnvStack
): PlaybookReplacementResult<string> {
  return substituteValues(
    credentialValue,
    envStack,
    { credentialName, credential, vault, security },
    { type: "credential", path: [] },
    () => ({
      body: undefined,
      parameters: undefined,
    })
  );
}

function replaceObject<T>(
  location: "stage-environment" | "request-environment" | "request",
  object: T,
  envStack: PlaybookEnvStack,
  fakeMaker: FakeMaker
): PlaybookReplacementResult<T> {
  const missing: PlaybookLookupFailure[] = [];
  const found: PlaybookLookupResult[] = [];

  const replaced = simpleClone(object, (value, sublocation) => {
    if (typeof value === "string") {
      const replaced = replaceString(
        value,
        envStack,
        object,
        { type: location, path: sublocation },
        fakeMaker
      );
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
  location: PlaybookVariableSubstitutionLocation,
  fakeMaker: FakeMaker
): PlaybookReplacementResult<unknown> {
  const matches = value.match(ENTIRE_SCANCONF_VAR_REGEX());
  if (matches && (matches.length === 2 || matches.length === 3)) {
    // ENTIRE_ENV_VAR_REGEX replaces entire value, possibly changing its type
    const name = matches[1];
    const parameter = matches[2];
    return replaceValue(name, value, parameter, envStack, object, location, fakeMaker);
  } else {
    // replace parts of the string value, or possibly none at all
    return substituteValues(value, envStack, object, location, fakeMaker);
  }
}

function replaceValue(
  name: string,
  value: string,
  parameter: string | undefined,
  envStack: PlaybookEnvStack,
  object: unknown,
  location: PlaybookVariableSubstitutionLocation,
  fakeMaker: FakeMaker
): PlaybookReplacementResult<unknown> {
  const [result, error] = lookupOrDynamic(envStack, name, parameter, object, location, fakeMaker);
  if (error !== undefined) {
    return { found: [], missing: [{ name, location, error }], value };
  }
  return { found: [{ ...result, offset: 0, location }], missing: [], value: result.value };
}

function substituteValues(
  value: string,
  envStack: PlaybookEnvStack,
  object: unknown,
  location: PlaybookVariableSubstitutionLocation,
  fakeMaker: FakeMaker
): PlaybookReplacementResult<string> {
  const missing: PlaybookLookupFailure[] = [];
  const found: PlaybookLookupResult[] = [];

  // ENV_VAR_REGEX replaces part of a string value matched, resulting value is always a string
  const result = value.replace(
    SCANCONF_VAR_REGEX(),
    (match: string, name: string, parameter: string | undefined, offset: number): string => {
      const [result, error] = lookupOrDynamic(
        envStack,
        name,
        parameter,
        object,
        location,
        fakeMaker
      );
      if (error !== undefined) {
        missing.push({ name, location, error });
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

function lookupOrDynamic(
  envStack: PlaybookEnvStack,
  varname: string,
  parameter: string | undefined,
  object: unknown,
  location: PlaybookVariableSubstitutionLocation,
  fakeMaker: () => { body: unknown; parameters: unknown }
): Result<PlaybookLookupResult, string> {
  if (DynamicVariableNames.includes(varname as DynamicVariableName)) {
    const [dynamic, error] = DynamicVariables[varname as DynamicVariableName](
      object,
      parameter,
      location,
      fakeMaker
    );
    if (error !== undefined) {
      return [undefined, error];
    }
    return [
      { source: { type: "built-in" }, location, offset: 0, value: dynamic, name: varname },
      undefined,
    ];
  } else {
    return lookup(envStack, varname, location);
  }
}

function createFake(
  oas: BundledSwaggerOrOasSpec,
  operation: OpenApi31.Operation | OpenApi30.Operation | Swagger.Operation | undefined,
  path: string,
  method: HttpMethod
): { body: unknown; parameters: unknown } {
  const result: { body: unknown; parameters: unknown } = { body: undefined, parameters: undefined };

  if (operation === undefined) {
    return result;
  }

  if (isOpenapi(oas)) {
    const requestBody = deref(
      oas,
      (operation as OpenApi31.Operation | OpenApi30.Operation).requestBody
    );
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

export function getMissingVariableNames(missing: PlaybookLookupFailure[]): string {
  return missing.map((missing) => missing.name).join(", ");
}
