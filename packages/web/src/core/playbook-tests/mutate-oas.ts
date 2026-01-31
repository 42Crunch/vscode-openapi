import { BundledSwaggerOrOasSpec, SecurityRequirement, getOperationById } from "@xliic/openapi";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { Result, success, failure } from "@xliic/result";

export function updateSecurityRequirements(
  oas: BundledSwaggerOrOasSpec,
  operationId: string,
  security: SecurityRequirement[]
): Result<BundledSwaggerOrOasSpec, string> {
  const cloned = simpleClone(oas);

  const operation = getOperationById(cloned, operationId);
  if (operation === undefined) {
    return failure(`Operation with ID '${operationId}' not found in the OAS spec.`);
  }

  operation.operation.security = security;

  return success(cloned);
}
