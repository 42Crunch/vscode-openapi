import { BundledSwaggerOrOasSpec, HttpMethod, OpenApi30, Swagger, isOpenapi } from "@xliic/openapi";
import { Scanconf } from "@xliic/scanconf";
import { makeOperationId } from ".";

export type OperationAdded = {
  type: "operation-added";
  path: string;
  method: HttpMethod;
  operationId: string;
};

export type OperationRemoved = {
  type: "operation-removed";
  operationId: string;
};

export type Change = OperationAdded | OperationRemoved;

export type OperationId = {
  path: string;
  method: HttpMethod;
  operationId: string;
};

export function compare(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): Change[] {
  return [
    ...operationsAdded(oas, scanconf.operations || {}),
    ...operationsRemoved(oas, scanconf.operations || {}),
  ];
}
export function operationsAdded(
  oas: BundledSwaggerOrOasSpec,
  scanconfOperations: Record<string, Scanconf.Operation>
): OperationAdded[] {
  // operations present in OAS but missing from scanconf
  return getOperations(oas)
    .filter((operation) => !scanconfOperations[operation.operationId])
    .map((operation) => ({
      type: "operation-added",
      ...operation,
    }));
}
export function operationsRemoved(
  oas: BundledSwaggerOrOasSpec,
  scanconfOperations: Record<string, Scanconf.Operation>
): OperationRemoved[] {
  const oasOperationIds = getOperations(oas).map((operation) => operation.operationId);
  const scanconfOperationIds = Object.keys(scanconfOperations);
  return scanconfOperationIds
    .filter((operationId) => !oasOperationIds.includes(operationId))
    .map((operationId) => ({
      type: "operation-removed",
      operationId,
    }));
}
export function getOperations(oas: BundledSwaggerOrOasSpec): OperationId[] {
  const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);

  return operations.map(([path, method, operation]) => ({
    path,
    method,
    operationId: operation.operationId || makeOperationId(path, method),
  }));
}
