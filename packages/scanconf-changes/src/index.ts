import { BundledSwaggerOrOasSpec, Swagger, OpenApi30, isOpenapi, HttpMethod } from "@xliic/openapi";
import { Scanconf } from "@xliic/scanconf";
import { Change, OperationAdded, OperationRemoved } from "./changes";

export type { Change } from "./changes";

export function compare(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): Change[] {
  return [
    ...operationsAdded(oas, scanconf.operations || {}),
    ...operationsRemoved(oas, scanconf.operations || {}),
  ];
}

type OperationId = {
  path: string;
  method: HttpMethod;
  operationId: string;
};

function operationsAdded(
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

function operationsRemoved(
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

function getCommonOperations(
  oas: BundledSwaggerOrOasSpec,
  scanconfOperations: Record<string, Scanconf.Operation>
): OperationId[] {
  return getOperations(oas).filter((operation) => !!scanconfOperations[operation.operationId]);
}

function getOperations(oas: BundledSwaggerOrOasSpec): OperationId[] {
  const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);

  return operations.map(([path, method, operation]) => ({
    path,
    method,
    operationId: operation.operationId || makeOperationId(path, method),
  }));
}

function makeOperationId(path: string, method: HttpMethod) {
  return `${path}:${method}`;
}

// paths missing from scanconf, must be paths recently added to the OAS
function pathsMissingFromScanconf(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): string[] {
  const oasPaths = Object.keys(oas.paths);
  const scanconfPaths = Object.keys(scanconf.operations || {});

  return difference(oasPaths, scanconfPaths);
}

// paths missing from from the OAS, must be paths recently removed from the OAS
function pathsMissingFromOas(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): string[] {
  const oasPaths = Object.keys(oas.paths);
  const scanconfPaths = Object.keys(scanconf.operations || {});

  return difference(scanconfPaths, oasPaths);
}

function difference(a: string[], b: string[]): string[] {
  return a.filter((x) => !b.includes(x));
}
