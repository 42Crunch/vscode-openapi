import { Swagger, HttpMethod } from "@xliic/openapi";

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
