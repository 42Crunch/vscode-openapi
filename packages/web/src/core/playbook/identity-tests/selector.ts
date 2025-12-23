import { BundledSwaggerOrOasSpec, getOperations, makeOperationId } from "@xliic/openapi";

export function selectOperationBySecurityScheme(
  oas: BundledSwaggerOrOasSpec,
  name: string
): string[] {
  const matchingOperations = getOperations(oas).filter(([path, method, operation]) => {
    const security = operation.security ?? (oas.security || []);
    return security.some((secReq) => Object.keys(secReq).includes(name));
  });

  const operationIds = matchingOperations.map(([path, method, operation]) =>
    makeOperationId(operation.operationId, path, method)
  );

  return operationIds;
}

export function selectOperationsToTest(
  oas: BundledSwaggerOrOasSpec,
  operationIds: string[]
): string[] {
  return operationIds; //.slice(0, 1);
}
