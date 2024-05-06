import { BundledSwaggerOrOasSpec, HttpMethod, OpenApi30, Swagger, isOpenapi } from "@xliic/openapi";

import { Scanconf } from "@xliic/scanconf";
import { makeOperationId } from ".";
import { findReferences } from "./references/find";
import { findRenamedOperations as operationsRenamed } from "./renames";
import {
  SecurityAdded,
  SecurityRemoved,
  Change,
  OperationAdded,
  OperationId,
  OperationRemoved,
} from "./types";

export function compare(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): Change[] {
  const added = operationsAdded(oas, scanconf);
  const removed = operationsRemoved(oas, scanconf);
  const renamed = operationsRenamed(added, removed);

  const addedNoRenames = added.filter(
    (operation) => !renamed.some((rename) => rename.newOperationId === operation.operationId)
  );

  const removedNoRenames = removed.filter(
    (operation) => !renamed.some((rename) => rename.oldOperationId === operation.operationId)
  );

  const authAdded = securityAdded(oas, scanconf);
  return [...addedNoRenames, ...removedNoRenames, ...renamed, ...authAdded];
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

  const removed: OperationRemoved[] = [];

  for (const operationId of removedIds) {
    const request = getScanconfOperation(operationId, scanconf)?.request?.request;
    if (request?.type === "42c" && request.details.url.startsWith("{{host}}")) {
      const method = request.details.method.toLowerCase() as HttpMethod;
      const path = request.details.url.substring("{{host}}".length);
      removed.push({
        type: "operation-removed",
        operationId,
        method,
        path,
        references: findReferences(scanconf, operationId),
      });
    } else {
      throw new Error(
        `Unsupported operation: operationId: ${operationId}, request ${JSON.stringify(request)}`
      );
    }
  }

  return removed;
}

export function getOperations(oas: BundledSwaggerOrOasSpec): OperationId[] {
  const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);

  return operations.map(([path, method, operation]) => ({
    path,
    method,
    operationId: operation.operationId || makeOperationId(path, method),
  }));
}

function getScanconfOperation(
  operationId: string,
  scanconf: Scanconf.ConfigurationFileBundle
): Scanconf.Operation | undefined {
  return scanconf.operations?.[operationId];
}

export function securityAdded(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): SecurityAdded[] {
  const scanconfAuthDetails: any = scanconf.authenticationDetails || [{}];
  if (scanconfAuthDetails.length === 0) {
    return [];
  }
  return getSecuritySchemes(oas)
    .filter((schema) => !scanconfAuthDetails[0][schema])
    .map((schema) => ({
      type: "security-added",
      schema,
    }));
}

export function securityRemoved(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): SecurityRemoved[] {
  const scanconfAuthDetails: any = scanconf.authenticationDetails || [{}];
  if (scanconfAuthDetails.length === 0) {
    return [];
  }
  const oasAuthDetails = getSecuritySchemes(oas);
  return Object.keys(scanconfAuthDetails[0])
    .filter((schema) => !oasAuthDetails.includes(schema))
    .map((schema) => ({
      type: "security-removed",
      schema,
    }));
}

export function getSecuritySchemes(oas: BundledSwaggerOrOasSpec): string[] {
  if (isOpenapi(oas)) {
    const securitySchemes = oas.components?.securitySchemes;
    return securitySchemes ? Object.keys(securitySchemes) : [];
  } else {
    const securityDefinitions = oas.securityDefinitions;
    return securityDefinitions ? Object.keys(securityDefinitions) : [];
  }
}
