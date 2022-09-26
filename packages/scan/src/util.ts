import jsf from "json-schema-faker";

import {
  BundledOpenApiSpec,
  OasParameterLocation,
  OperationParametersMap,
  getPathItemParameters,
  getOperation,
  getOperationParameters,
  getParametersMap,
  OasSecurityScheme,
} from "@xliic/common/oas30";
import {
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurity,
  TryitSecurityValue,
  TryitSecurityValues,
} from "@xliic/common/messages/tryit";
import { HttpMethod } from "@xliic/common/http";

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

export function getSecurity(
  oas: BundledOpenApiSpec,
  path: string,
  method: HttpMethod
): TryitSecurity {
  const operation = getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  const result: TryitSecurity = [];
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
      if (parameter.schema) {
        jsf.option("useExamplesValue", true);
        jsf.option("failOnInvalidFormat", false);
        jsf.option("maxItems", 100);
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

export function generateSecurityValues(security: TryitSecurity): TryitSecurityValues {
  const result: TryitSecurityValues = [];
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
  if (security?.type === "http" && /^basic$/i.test(security?.scheme)) {
    return { username: "", password: "" };
  }
  return "";
}

export function wrapFormDefaults(values: TryitOperationValues): Record<string, any> {
  const parameters: Record<string, any> = { query: {}, header: {}, path: {}, cookie: {} };
  const locations = Object.keys(values.parameters) as OasParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(values.parameters[location])) {
      const escapedName = escapeFieldName(name);
      const value = values.parameters[location][name];
      parameters[location][escapedName] = Array.isArray(value) ? wrap(value) : value;
    }
  }
  const security: TryitSecurityValues = [];
  for (const requirement of values.security) {
    const wrapped: Record<string, TryitSecurityValue> = {};
    for (const [name, value] of Object.entries(requirement)) {
      wrapped[escapeFieldName(name)] = value;
    }
    security.push(wrapped);
  }

  return {
    parameters,
    body: values.body,
    server: values.server,
    security,
    securityIndex: values.securityIndex,
  };
}

export function unwrapFormDefaults(
  oas: BundledOpenApiSpec,
  parameters: OperationParametersMap,
  values: Record<string, any>
): TryitOperationValues {
  return {
    parameters: unwrapFormParameters(oas, parameters, values.parameters),
    body: values.body,
    server: values.server,
    security: unwrapFormSecurity(values.security),
    securityIndex: values.securityIndex,
  };
}

function unwrapFormSecurity(values: Record<string, any>[]): TryitSecurityValues {
  const result: TryitSecurityValues = [];
  for (const requirement of values) {
    const unwrapped: Record<string, TryitSecurityValue> = {};
    for (const [name, value] of Object.entries(requirement as Record<string, TryitSecurityValue>)) {
      unwrapped[unescapeFieldName(name)] = value;
    }
    result.push(unwrapped);
  }
  return result;
}

function unwrapFormParameters(
  oas: BundledOpenApiSpec,
  parameters: OperationParametersMap,
  values: Record<string, any>
): TryitParameterValues {
  const result: TryitParameterValues = { query: {}, header: {}, path: {}, cookie: {} };
  const locations = Object.keys(values) as OasParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(values[location])) {
      const unescapedName = unescapeFieldName(name);
      const value = values[location][name];
      result[location][unescapedName] = Array.isArray(value) ? unwrap(value) : value;
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

// arrays must be wrapped for react form hook
function wrap(array: unknown[]): unknown {
  return array.map((value) => ({ value }));
}

function unwrap(array: unknown[]): unknown {
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
