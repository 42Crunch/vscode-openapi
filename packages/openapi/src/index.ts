import * as OpenApi30 from "./oas30";
import * as Swagger from "./swagger";
import { HttpMethod } from "./http";
import { deref } from "./ref";

export * as OpenApi30 from "./oas30";
export * as Swagger from "./swagger";
export { deref } from "./ref";
export type { RefOr } from "./ref";
export type { HttpMethod } from "./http";
export { HttpMethods } from "./http";

export type BundledSwaggerOrOasSpec = OpenApi30.BundledSpec | Swagger.BundledSpec;

export function isSwagger(spec: BundledSwaggerOrOasSpec): spec is Swagger.BundledSpec {
  return "swagger" in spec;
}

export function isOpenapi(spec: BundledSwaggerOrOasSpec): spec is OpenApi30.BundledSpec {
  return "openapi" in spec;
}

export function getOperation(
  oas: BundledSwaggerOrOasSpec,
  path: string,
  method: HttpMethod
): OpenApi30.Operation | Swagger.Operation | undefined {
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
):
  | { path: string; method: HttpMethod; operation: OpenApi30.Operation | Swagger.Operation }
  | undefined {
  const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);
  for (const [path, method, operation] of operations) {
    if (
      operation.operationId === operationId ||
      ((operation.operationId === undefined || operation.operationId === "") &&
        makeOperationId(path, method) === operationId)
    ) {
      return { path, method, operation };
    }
  }
}

export function getServerUrls(oas: BundledSwaggerOrOasSpec): string[] {
  return isOpenapi(oas) ? OpenApi30.getServerUrls(oas) : Swagger.getServerUrls(oas);
}
