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

import { HttpMethod } from "@xliic/common/http";

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
