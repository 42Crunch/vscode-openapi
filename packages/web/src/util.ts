import jsf from "json-schema-faker";
import { OpenApi30, OpenApi31, HttpMethod, deref, OpenApi3, BundledOasSpec } from "@xliic/openapi";
import {
  TryitOperationValues,
  TryItParameterLocation,
  TryitParameterValues,
  TryitSecurityValue,
  TryitSecurityAllValues,
} from "@xliic/common/tryit";
import { createDefaultBody } from "./core/form/body";

export function createDefaultValues(
  oas: BundledOasSpec,
  path: string,
  method: HttpMethod,
  preferredMediaType: string | undefined,
  preferredBodyValue: unknown
): TryitOperationValues {
  const operation = OpenApi3.getOperation(oas, path, method);
  // parameters
  const parameters = getParameters(oas, path, method);
  const parameterValues = generateParameterValues(oas, parameters);
  // security
  const security = OpenApi3.getSecurity(oas, path, method);
  const securityValues = generateSecurityValues(security);
  // body
  const body = createDefaultBody(oas, operation, preferredMediaType, preferredBodyValue);

  const serverUrls = OpenApi3.getServerUrls(oas);

  return {
    server: serverUrls?.[0] || "",
    parameters: parameterValues,
    security: securityValues,
    securityIndex: 0,
    body,
  };
}

export function getParameters<T extends OpenApi3.BundledSpec>(
  oas: T,
  path: string,
  method: HttpMethod
): OpenApi3.OperationParametersMap<T> {
  const pathParameters = oas.paths ? OpenApi3.getPathItemParameters(oas, oas.paths[path]) : [];
  const operation = OpenApi3.getOperation(oas, path, method);
  const operationParameters = OpenApi3.getOperationParameters(oas, operation);
  const result = OpenApi3.getParametersMap(oas, pathParameters, operationParameters);
  return result;
}

export function hasSecurityRequirements(
  oas: BundledOasSpec,
  path: string,
  method: HttpMethod
): boolean {
  const operation = OpenApi3.getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  return requirements.length > 0;
}

export function generateParameterValues(
  oas: BundledOasSpec,
  parameters: OpenApi31.OperationParametersMap | OpenApi30.OperationParametersMap
): TryitParameterValues {
  const values: TryitParameterValues = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  const locations = Object.keys(parameters) as OpenApi30.ParameterLocation[];
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
  security: OpenApi31.ResolvedOperationSecurity | OpenApi30.ResolvedOperationSecurity
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

export function generateSecurityValue(security: OpenApi30.SecurityScheme): TryitSecurityValue {
  if (security?.type === "http" && /^basic$/i.test(security?.scheme)) {
    return { username: "", password: "" };
  }
  return "";
}

export function wrapFormDefaults(values: TryitOperationValues): Record<string, any> {
  const parameters: Record<TryItParameterLocation, any> = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };
  const locations = Object.keys(values.parameters) as OpenApi30.ParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(values.parameters[location] ?? {})) {
      const escapedName = escapeFieldName(name);
      const value = values.parameters[location]![name];
      parameters[location][escapedName] = Array.isArray(value) ? wrap(value) : value;
    }
  }
  const security: TryitSecurityAllValues = [];
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

export function unwrapFormDefaults(values: Record<string, any>): TryitOperationValues {
  return {
    parameters: unwrapFormParameters(values.parameters),
    body: values.body,
    server: values.server,
    security: unwrapFormSecurity(values.security),
    securityIndex: values.securityIndex,
  };
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
  const locations = Object.keys(values) as OpenApi30.ParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(values[location])) {
      const unescapedName = unescapeFieldName(name);
      const value = values[location][name];
      result[location]![unescapedName] = Array.isArray(value) ? unwrap(value) : value;
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
