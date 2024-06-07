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

export function makeOperationId(
  oasOperationId: string | undefined,
  path: string,
  method: HttpMethod
) {
  if (oasOperationId === undefined || oasOperationId === "") {
    return `${path}:${method}`;
  }
  return oasOperationId;
}

export function getOperationById(
  oas: BundledSwaggerOrOasSpec,
  operationId: string
):
  | { path: string; method: HttpMethod; operation: OpenApi30.Operation | Swagger.Operation }
  | undefined {
  const operations = isOpenapi(oas) ? OpenApi30.getOperations(oas) : Swagger.getOperations(oas);
  for (const [path, method, operation] of operations) {
    if (makeOperationId(operation.operationId, path, method) === operationId) {
      return { path, method, operation };
    }
  }
}

export function getServerUrls(oas: BundledSwaggerOrOasSpec): string[] {
  return isOpenapi(oas) ? OpenApi30.getServerUrls(oas) : Swagger.getServerUrls(oas);
}

export function getHttpResponseRange(httpStatus: number) {
  if (httpStatus >= 100 && httpStatus <= 199) {
    return "1XX";
  } else if (httpStatus >= 200 && httpStatus <= 299) {
    return "2XX";
  } else if (httpStatus >= 300 && httpStatus <= 399) {
    return "3XX";
  } else if (httpStatus >= 400 && httpStatus <= 499) {
    return "4XX";
  } else if (httpStatus >= 500 && httpStatus <= 599) {
    return "5XX";
  }
}
