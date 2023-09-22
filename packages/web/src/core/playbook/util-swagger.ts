import {
  BundledSwaggerSpec,
  getPathItemParameters,
  getOperation,
  getOperationParameters,
  OperationParametersMap,
  getParametersMap,
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
