import jsf from "json-schema-faker";

import {
  BundledSwaggerSpec,
  SwaggerPathItem,
  SwaggerParameter,
  getPathItemParameters,
  getOperation,
  getOperationParameters,
  OperationParametersMap,
  getParametersMap,
  SwaggerParameterLocation,
  SwaggerOperation,
  getServerUrls,
  SwaggerSecurityScheme,
  ResolvedSwaggerOperationSecurity,
} from "@xliic/common/swagger";
import {
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurityValue,
  TryitSecurityAllValues,
} from "@xliic/common/tryit";
import { HttpMethod } from "@xliic/common/http";
import { createDefaultBody } from "./core/form/body-swagger";

export function createDefaultValues(
  oas: BundledSwaggerSpec,
  path: string,
  method: HttpMethod,
  preferredMediaType: string | undefined,
  preferredBodyValue: unknown
): TryitOperationValues {
  const operation = getOperation(oas, path, method);
  // parameters
  const parameters = getParameters(oas, path, method);
  const parameterValues = generateParameterValues(oas, parameters);
  // security
  const security = getSecurity(oas, path, method);
  const securityValues = generateSecurityValues(security);

  const serverUrls = getServerUrls(oas);

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
  oas: BundledSwaggerSpec,
  path: string,
  method: HttpMethod
): OperationParametersMap {
  const pathParameters = getPathItemParameters(oas, oas.paths[path]);
  const operation = getOperation(oas, path, method);
  const operationParameters = getOperationParameters(oas, operation);
  const result = getParametersMap(oas, pathParameters, operationParameters);
  return result;
}

export function generateParameterValues(
  oas: BundledSwaggerSpec,
  parameters: OperationParametersMap
): TryitParameterValues {
  const values: TryitParameterValues = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  const locations = Object.keys(parameters) as SwaggerParameterLocation[];
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
        jsf.option("maxItems", 100);
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
  oas: BundledSwaggerSpec,
  path: string,
  method: HttpMethod
): boolean {
  const operation = getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  return requirements.length > 0;
}

export function getSecurity(
  oas: BundledSwaggerSpec,
  path: string,
  method: HttpMethod
): ResolvedSwaggerOperationSecurity {
  const operation = getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  const result: ResolvedSwaggerOperationSecurity = [];
  for (const requirement of requirements) {
    const resolved: Record<string, SwaggerSecurityScheme> = {};
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
  security: ResolvedSwaggerOperationSecurity
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

export function generateSecurityValue(security: SwaggerSecurityScheme): TryitSecurityValue {
  if (security?.type === "basic") {
    return { username: "", password: "" };
  }
  return "";
}
