import { BundledSwaggerOrOasSpec, HttpMethod, OpenApi30, Swagger, isOpenapi } from "@xliic/openapi";

import { Scanconf } from "@xliic/scanconf";
import { makeOperationId } from ".";
import { findReferences, StageLocation } from "./references";

export type OperationAdded = {
  type: "operation-added";
  path: string;
  method: HttpMethod;
  operationId: string;
};

export type OperationRemoved = {
  type: "operation-removed";
  operationId: string;
  references: StageLocation[];
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
  const added = operationsAdded(oas, scanconf);
  const removed = operationsRemoved(oas, scanconf);
  return [...added, ...removed];
}

export function operationsAdded(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): OperationAdded[] {
  // operations present in OAS but missing from scanconf
  const scanconfOperations = scanconf.operations || {};
  return getOperations(oas)
    .filter((operation) => !scanconfOperations[operation.operationId])
    .map((operation) => ({
      type: "operation-added",
      ...operation,
    }));
}

export function operationsRemoved(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): OperationRemoved[] {
  const scanconfOperations = scanconf.operations || {};
  const oasOperationIds = getOperations(oas).map((operation) => operation.operationId);
  const scanconfOperationIds = Object.keys(scanconfOperations);

  const removedIds = scanconfOperationIds.filter(
    (operationId) => !oasOperationIds.includes(operationId)
  );

  return removedIds.map((operationId) => ({
    type: "operation-removed",
    operationId,
    references: findReferences(scanconf, operationId),
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
