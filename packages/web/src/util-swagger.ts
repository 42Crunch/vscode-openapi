import jsf from "json-schema-faker";

import { Swagger, HttpMethod } from "@xliic/openapi";
import {
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurityValue,
  TryitSecurityAllValues,
} from "@xliic/common/tryit";
import { createDefaultBody } from "./core/form/body-swagger";

export function createDefaultValues(
  oas: Swagger.BundledSpec,
  path: string,
  method: HttpMethod,
  preferredMediaType: string | undefined,
  preferredBodyValue: unknown
): TryitOperationValues {
  const operation = Swagger.getOperation(oas, path, method);
  // parameters
  const parameters = getParameters(oas, path, method);
  const parameterValues = generateParameterValues(oas, parameters);
  // security
  const security = getSecurity(oas, path, method);
  const securityValues = generateSecurityValues(security);

  const serverUrls = Swagger.getServerUrls(oas);

  const body = createDefaultBody(
    oas,
    operation!,
    parameters,
    preferredMediaType,
    preferredBodyValue
  );

  return {
    server: serverUrls?.[0] || "",
    parameters: parameterValues,
    security: securityValues,
    securityIndex: 0,
    body,
  };
}

export function getParameters(
  oas: Swagger.BundledSpec,
  path: string,
  method: HttpMethod
): Swagger.OperationParametersMap {
  const pathParameters = Swagger.getPathItemParameters(oas, oas.paths[path]);
  const operation = Swagger.getOperation(oas, path, method);
  const operationParameters = Swagger.getOperationParameters(oas, operation);
  const result = Swagger.getParametersMap(oas, pathParameters, operationParameters);
  return result;
}

export function generateParameterValues(
  oas: Swagger.BundledSpec,
  parameters: Swagger.OperationParametersMap
): TryitParameterValues {
  const values: TryitParameterValues = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  const locations = Object.keys(parameters) as Swagger.ParameterLocation[];
  for (const location of locations) {
    if (location === "body" || location === "formData") {
      // don't generate body or formData
      continue;
    }
    for (const name of Object.keys(parameters[location])) {
      const parameter = parameters[location][name];
      if (parameter.type) {
        jsf.option("useExamplesValue", true);
        jsf.option("failOnInvalidFormat", false);
        jsf.option("maxLength", 4096);
        jsf.option("alwaysFakeOptionals", true);

        try {
          values[location][name] = jsf.generate({
            ...parameter,
            definitions: oas.definitions,
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

export function hasSecurityRequirements(
  oas: Swagger.BundledSpec,
  path: string,
  method: HttpMethod
): boolean {
  const operation = Swagger.getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  return requirements.length > 0;
}

export function getSecurity(
  oas: Swagger.BundledSpec,
  path: string,
  method: HttpMethod
): Swagger.ResolvedOperationSecurity {
  const operation = Swagger.getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  const result: Swagger.ResolvedOperationSecurity = [];
  for (const requirement of requirements) {
    const resolved: Record<string, Swagger.SecurityScheme> = {};
    for (const schemeName of Object.keys(requirement)) {
      // check if the requsted security scheme is defined in the OAS
      if (oas?.securityDefinitions?.[schemeName]) {
        resolved[schemeName] = oas?.securityDefinitions?.[schemeName]!;
      }
    }
    result.push(resolved);
  }
  return result;
}

export function generateSecurityValues(
  security: Swagger.ResolvedOperationSecurity
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

export function generateSecurityValue(security: Swagger.SecurityScheme): TryitSecurityValue {
  if (security?.type === "basic") {
    return { username: "", password: "" };
  }
  return "";
}
