import {
  BundledOpenApiSpec,
  OasOperation,
  getServerUrls as getOasServerUrls,
  getOperations as getOasOperations,
} from "./oas30";
import {
  BundledSwaggerSpec,
  SwaggerOperation,
  getServerUrls as getSwaggerServerUrls,
  getOperations as getSwaggerOperations,
} from "./swagger";
import { HttpMethod, HttpMethods } from "./http";
import { deref } from "./ref";

export * as OpenApi30 from "./oas30";
export * as Swagger from "./swagger";
export { deref } from "./ref";
export type { HttpMethod } from "./http";
export { HttpMethods } from "./http";

export type BundledSwaggerOrOasSpec = BundledOpenApiSpec | BundledSwaggerSpec;

export function isSwagger(spec: BundledSwaggerOrOasSpec): spec is BundledSwaggerSpec {
  return "swagger" in spec;
}

export function isOpenapi(spec: BundledSwaggerOrOasSpec): spec is BundledOpenApiSpec {
  return "openapi" in spec;
}

export function getOperation(
  oas: BundledSwaggerOrOasSpec,
  path: string,
  method: HttpMethod
): OasOperation | SwaggerOperation | undefined {
  if (method === "trace") {
    if (isOpenapi(oas)) {
      return deref(oas, oas.paths[path])?.[method];
    }
    // swagger does no define 'trace' method
    return undefined;
  }
  return deref(oas, oas.paths[path])?.[method];
}

export function makeOperationId(path: string, method: HttpMethod) {
  return `${path}:${method}`;
}

export function getOperationById(
  oas: BundledSwaggerOrOasSpec,
  operationId: string
): { path: string; method: HttpMethod; operation: OasOperation | SwaggerOperation } | undefined {
  const operations = isOpenapi(oas) ? getOasOperations(oas) : getSwaggerOperations(oas);
  for (const [path, method, operation] of operations) {
    if (
      operation.operationId === operationId ||
      (operation.operationId === undefined && makeOperationId(path, method) === operationId)
    ) {
      return { path, method, operation };
    }
  }
}

export function getServerUrls(oas: BundledSwaggerOrOasSpec): string[] {
  return isOpenapi(oas) ? getOasServerUrls(oas) : getSwaggerServerUrls(oas);
}
