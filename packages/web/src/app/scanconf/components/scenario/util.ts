import jsf from "json-schema-faker";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { deref } from "@xliic/common/ref";
import { makeOperationId } from "@xliic/common/openapi";

import {
  BundledOpenApiSpec,
  OasParameterLocation,
  OperationParametersMap,
  getPathItemParameters,
  getOperation,
  getOperationParameters,
  getParametersMap,
  OasSecurityScheme,
  getServerUrls,
  OasOperation,
  ResolvedOasOperationSecurity,
} from "@xliic/common/oas30";
import {
  TryItParameterLocation,
  TryitParameterValues,
  TryitSecurityValue,
  TryitSecurityAllValues,
} from "@xliic/common/tryit";
import { HttpMethod } from "@xliic/common/http";
import * as playbook from "@xliic/common/playbook";

import { FieldValues } from "react-hook-form";

export function getParameters(
  oas: BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): OperationParametersMap {
  const pathParameters = getPathItemParameters(oas, oas.paths[path]);
  const operation = getOperation(oas, path, method);
  const operationParameters = getOperationParameters(oas, operation);
  const result = getParametersMap(oas, pathParameters, operationParameters);
  return result;
}

export function hasSecurityRequirements(
  oas: BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): boolean {
  const operation = getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  return requirements.length > 0;
}

export function getSecurity(
  oas: BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): ResolvedOasOperationSecurity {
  const operation = getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  const result: ResolvedOasOperationSecurity = [];
  for (const requirement of requirements) {
    const resolved: Record<string, OasSecurityScheme> = {};
    for (const schemeName of Object.keys(requirement)) {
      // check if the requsted security scheme is defined in the OAS
      if (oas?.components?.securitySchemes?.[schemeName]) {
        resolved[schemeName] = oas?.components?.securitySchemes?.[schemeName]!;
      }
    }
    result.push(resolved);
  }
  return result;
}

export function generateParameterValues(
  oas: BundledOpenApiSpec,
  parameters: OperationParametersMap
): TryitParameterValues {
  const values: TryitParameterValues = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  const locations = Object.keys(parameters) as OasParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(parameters[location])) {
      const parameter = parameters[location][name];
      if (parameter?.example !== undefined) {
        values[location][name] = parameter.example;
      } else if (parameter?.examples && Object.values(parameter.examples).length > 0) {
        const example = Object.values(parameter.examples)[0];
        const value = deref(oas, example)?.value;
        values[location][name] = value === undefined ? "" : value;
      } else if (parameter.schema) {
        jsf.option("useExamplesValue", true);
        jsf.option("failOnInvalidFormat", false);
        jsf.option("maxLength", 4096);
        jsf.option("alwaysFakeOptionals", true);
        try {
          values[location][name] = jsf.generate({
            ...parameter.schema,
            components: oas.components,
          } as any);
        } catch (e) {
          values[location][name] = "";
          // FIXME: show error in UI
        }
      } else {
        values[location][name] = "";
      }
    }
  }

  return values;
}

export function generateSecurityValues(
  security: ResolvedOasOperationSecurity
): TryitSecurityAllValues {
  const result: TryitSecurityAllValues = [];
  for (const requirement of security) {
    const resolved: Record<string, TryitSecurityValue> = {};
    for (const [name, scheme] of Object.entries(requirement)) {
      if (scheme) {
        resolved[name] = generateSecurityValue(scheme);
      }
    }
    result.push(resolved);
  }
  return result;
}

export function generateSecurityValue(security: OasSecurityScheme): TryitSecurityValue {
  if (security?.type === "http" && security.scheme && /^basic$/i.test(security.scheme)) {
    return { username: "", password: "" };
  }
  return "";
}

export function wrapPlaybookStage(stage: playbook.StageReference): Record<string, any> {
  stage = simpleClone(stage);
  return {
    ...stage,
    fuzzing: stage.fuzzing === true,
    expectedResponse: stage.expectedResponse !== undefined ? stage.expectedResponse : "",
    environment: wrapEnvironment(stage.environment),
    responses: wrapResponses(stage.responses),
  };
}

export function unwrapPlaybookStage(stage: FieldValues): playbook.StageReference {
  return {
    ...stage,
    fuzzing: stage.fuzzing === true ? true : undefined,
    expectedResponse: stage.expectedResponse !== "" ? stage.expectedResponse : undefined,
    environment: unwrapEnvironment(stage.environment),
    responses: unwrapResponses(stage.responses),
  } as playbook.StageReference;
}

export function wrapPlaybookRequest(stage: playbook.StageContent): Record<string, any> {
  stage = simpleClone(stage);

  const parameters: Record<playbook.ParameterLocation, any> = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  const locations = Object.keys(stage.request.parameters) as OasParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(stage.request.parameters[location] ?? {})) {
      const escapedName = escapeFieldName(name);
      const value = stage.request.parameters[location]![name];
      parameters[location][escapedName] = Array.isArray(value) ? wrapArray(value) : value;
    }
  }

  return {
    path: stage.request.path,
    method: stage.request.method,
    parameters,
    body: stage.request.body,
    environment: wrapEnvironment(stage.environment),
    defaultResponse: stage.defaultResponse,
    injectionKey: stage.injectionKey,
    fuzzing: stage.fuzzing,
    operationId: stage.operationId,
    requestOperationId: stage.request.operationId,
    responses: wrapResponses(stage.responses),
    auth: stage.auth,
  };
}

export function wrapExternalPlaybookRequest(
  stage: playbook.ExternalStageContent
): Record<string, any> {
  stage = simpleClone(stage);

  const parameters: Record<playbook.ParameterLocation, any> = {
    query: wrapObject2(stage.request.parameters.query),
    header: wrapObject2(stage.request.parameters.header),
    path: wrapObject2(stage.request.parameters.path),
    cookie: wrapObject2(stage.request.parameters.cookie),
  };

  return {
    url: stage.request.url,
    method: stage.request.method,
    parameters,
    body: stage.request.body,
    environment: wrapEnvironment(stage.environment),
    defaultResponse: stage.defaultResponse,
    responses: wrapResponses(stage.responses),
  };
}

function wrapEnvironment(environment: playbook.Environment | undefined) {
  const wrapped = Object.entries(environment || {}).map(([key, value]) => ({
    key,
    value,
    type: typeof value,
  }));
  return wrapped;
}

function wrapResponses(responses: playbook.Responses | undefined) {
  return Object.entries(responses || {}).map(([key, value]) => {
    return {
      key,
      value: {
        ...value,
        variableAssignments: wrapVariableAssignments(value.variableAssignments),
      },
    };
  });
}

function unwrapResponses(data: any): playbook.Responses {
  const result: playbook.Responses = {};
  for (const { key, value } of data) {
    result[key] = {
      ...value,
      variableAssignments: unwrapVariableAssignments(value.variableAssignments),
    };
  }
  return result;
}

function wrapVariableAssignments(assignments: playbook.VariableAssignments | undefined) {
  return Object.entries(assignments || {}).map(([key, value]) => {
    return {
      key,
      value,
    };
  });
}

function unwrapVariableAssignments(data: any): playbook.VariableAssignments {
  const result: playbook.VariableAssignments = {};
  for (const { key, value } of data) {
    result[key] = value;
  }
  return result;
}

export function unwrapPlaybookRequest(request: FieldValues): playbook.StageContent {
  request = simpleClone(request);
  return {
    ref: undefined,
    request: {
      path: request.path,
      method: request.method,
      parameters: unwrapFormParameters(request.parameters),
      body: request.body,
      operationId: request.requestOperationId,
    },
    fuzzing: request.fuzzing,
    injectionKey: request.injectionKey,
    environment: unwrapEnvironment(request.environment),
    defaultResponse: request.defaultResponse,
    responses: unwrapResponses(request.responses),
    auth: request.auth,
    operationId: request.operationId,
  };
}

export function unwrapExternalPlaybookRequest(request: FieldValues): playbook.ExternalStageContent {
  request = simpleClone(request);
  return {
    request: {
      url: request.url,
      method: request.method,
      parameters: {
        query: unwrapObject2(request.parameters.query),
        header: unwrapObject2(request.parameters.header),
        path: unwrapObject2(request.parameters.path),
        cookie: unwrapObject2(request.parameters.cookie),
      },
      body: request.body,
    },
    environment: unwrapEnvironment(request.environment),
    defaultResponse: request.defaultResponse,
    responses: unwrapResponses(request.responses),
    operationId: undefined,
  };
}

function unwrapEnvironment(data: any): playbook.Environment {
  const environment: playbook.Environment = {};
  for (const item of data) {
    environment[item.key] = convertToType(item.value, item.type);
  }
  return environment;
}

function unwrapFormSecurity(values: Record<string, any>[]): TryitSecurityAllValues {
  const result: TryitSecurityAllValues = [];
  for (const requirement of values) {
    const unwrapped: Record<string, TryitSecurityValue> = {};
    for (const [name, value] of Object.entries(requirement as Record<string, TryitSecurityValue>)) {
      unwrapped[unescapeFieldName(name)] = value;
    }
    result.push(unwrapped);
  }
  return result;
}

function unwrapFormParameters(values: Record<string, any>): TryitParameterValues {
  const result: TryitParameterValues = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };
  const locations = Object.keys(values) as OasParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(values[location])) {
      const unescapedName = unescapeFieldName(name);
      const value = values[location][name];
      result[location]![unescapedName] = Array.isArray(value) ? unwrapArray(value) : value;
    }
  }
  return result;
}

export function parseHttpsHostname(url: string): [boolean, string] {
  try {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const hostname = urlObj.hostname.toLowerCase();
    return [isHttps, hostname];
  } catch (e) {
    return [false, ""];
  }
}

function wrapObject(object: any) {
  const wrapped = Object.entries(object || {}).map(([key, value]) => ({
    key: escapeFieldName(key),
    value,
  }));
  return wrapped;
}

function wrapObject2(object: any) {
  return Object.entries(object || {}).map(([key, value]) => ({
    key,
    value,
  }));
}

function unwrapObject(data: any): any {
  const result: any = {};
  for (const item of data) {
    result[unescapeFieldName(item.key)] = item.value;
  }
  return result;
}

function unwrapObject2(data: any): any {
  const result: any = {};
  for (const item of data) {
    result[item.key] = item.value;
  }
  return result;
}

// arrays must be wrapped for react form hook
function wrapArray(array: unknown[] | undefined): unknown {
  return (array || []).map((value) => ({ value }));
}

function unwrapArray(array: unknown[]): unknown {
  return array.map((element) => (element as any)["value"]);
}

export function escapeFieldName(name: string): string {
  // escape field name for react form hook, dots and numbers at the start of the name are not allowed
  return "n-" + encodeURIComponent(name).replace(/\./g, "%2E");
}

function unescapeFieldName(name: string): string {
  // remove n- prefix and decode field name
  return decodeURIComponent(name.substring(2, name.length));
}

function convertToType(value: string, type: string): unknown {
  if (type !== "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      // failed to convert, return string value
      return value;
    }
  }

  return `${value}`;
}
