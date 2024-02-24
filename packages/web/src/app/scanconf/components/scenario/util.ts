import jsf from "json-schema-faker";
import { FieldValues } from "react-hook-form";

import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { OpenApi30, HttpMethod, deref } from "@xliic/openapi";
import * as playbook from "@xliic/common/playbook";
import {
  TryitParameterValues,
  TryitSecurityAllValues,
  TryitSecurityValue,
} from "@xliic/common/tryit";

export function getParameters(
  oas: OpenApi30.BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): OpenApi30.OperationParametersMap {
  const pathParameters = OpenApi30.getPathItemParameters(oas, oas.paths[path]);
  const operation = OpenApi30.getOperation(oas, path, method);
  const operationParameters = OpenApi30.getOperationParameters(oas, operation);
  const result = OpenApi30.getParametersMap(oas, pathParameters, operationParameters);
  return result;
}

export function hasSecurityRequirements(
  oas: OpenApi30.BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): boolean {
  const operation = OpenApi30.getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  return requirements.length > 0;
}

export function getSecurity(
  oas: OpenApi30.BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): OpenApi30.ResolvedOasOperationSecurity {
  const operation = OpenApi30.getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  const result: OpenApi30.ResolvedOasOperationSecurity = [];
  for (const requirement of requirements) {
    const resolved: Record<string, OpenApi30.OasSecurityScheme> = {};
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
  oas: OpenApi30.BundledOpenApiSpec,
  parameters: OpenApi30.OperationParametersMap
): TryitParameterValues {
  const values: TryitParameterValues = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  const locations = Object.keys(parameters) as OpenApi30.OasParameterLocation[];
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
  security: OpenApi30.ResolvedOasOperationSecurity
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

export function generateSecurityValue(security: OpenApi30.OasSecurityScheme): TryitSecurityValue {
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

  return {
    path: stage.request.path,
    method: stage.request.method,
    parameters: stage.request.parameters,
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

  return {
    url: stage.request.url,
    method: stage.request.method,
    parameters: stage.request.parameters,
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
      parameters: request.parameters,
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
      parameters: request.parameters,
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

export function escapeFieldName(name: string): string {
  // escape field name for react form hook, dots and numbers at the start of the name are not allowed
  return "n-" + encodeURIComponent(name).replace(/\./g, "%2E");
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
