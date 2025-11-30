import * as OpenApi30 from "./oas30";
import * as OpenApi31 from "./oas31";
import * as OpenApi3 from "./oas3";
import * as Swagger from "./swagger";
import { HttpMethod, HttpMethods } from "./http";
import { deref } from "./ref";

export * as OpenApi30 from "./oas30";
export * as OpenApi31 from "./oas31";
export * as OpenApi3 from "./oas3";
export * as Swagger from "./swagger";
export { deref } from "./ref";
export type { RefOr } from "./ref";
export type { HttpMethod } from "./http";
export { HttpMethods } from "./http";

export type BundledSwaggerOrOasSpec =
  | OpenApi31.BundledSpec
  | OpenApi30.BundledSpec
  | Swagger.BundledSpec;

export type BundledSwaggerOrOas30Spec = OpenApi30.BundledSpec | Swagger.BundledSpec;

export type BundledOasSpec = OpenApi30.BundledSpec | OpenApi31.BundledSpec;

export function isSwagger(spec: BundledSwaggerOrOasSpec): spec is Swagger.BundledSpec {
  return "swagger" in spec;
}

export function isOpenapi(spec: BundledSwaggerOrOasSpec): spec is OpenApi3.BundledSpec {
  return "openapi" in spec;
}

type OperationTypeForSpec<S extends BundledSwaggerOrOasSpec> = S extends OpenApi31.BundledSpec
  ? OpenApi31.Operation
  : S extends OpenApi30.BundledSpec
  ? OpenApi30.Operation
  : S extends Swagger.BundledSpec
  ? Swagger.Operation
  : never;

export function getOperation<S extends BundledSwaggerOrOasSpec>(
  oas: S,
  path: string,
  method: HttpMethod
): OperationTypeForSpec<S> | undefined {
  if (method === "trace") {
    if (isOpenapi(oas)) {
      return deref(oas, oas.paths?.[path])?.[method] as OperationTypeForSpec<S>;
    }
    // swagger does not define 'trace' method
    return undefined;
  }
  return deref(oas, oas.paths?.[path])?.[method] as OperationTypeForSpec<S>;
}

export function getOperations<S extends BundledSwaggerOrOasSpec>(
  oas: S
): [string, HttpMethod, OperationTypeForSpec<S>][] {
  const operations: [string, HttpMethod, OperationTypeForSpec<S>][] = [];
  for (const path of Object.keys(oas.paths ?? {})) {
    for (const method of Object.keys(oas.paths?.[path] ?? {})) {
      if (HttpMethods.includes(method as HttpMethod)) {
        const operation = getOperation(oas, path, method as HttpMethod)!;
        operations.push([path, method as HttpMethod, operation]);
      }
    }
  }
  return operations;
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

export function getOperationById<S extends BundledSwaggerOrOasSpec>(
  oas: S,
  operationId: string
):
  | {
      path: string;
      method: HttpMethod;
      operation: OperationTypeForSpec<S>;
    }
  | undefined {
  const operations = getOperations(oas);
  for (const [path, method, operation] of operations) {
    if (makeOperationId(operation.operationId, path, method) === operationId) {
      return { path, method, operation };
    }
  }
}

export function getServerUrls(oas: BundledSwaggerOrOasSpec): string[] {
  return isOpenapi(oas) ? OpenApi3.getServerUrls(oas) : Swagger.getServerUrls(oas);
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

export function getSecurityScheme(oas: BundledSwaggerOrOasSpec, schemeName: string) {
  if (isOpenapi(oas)) {
    return oas.components?.securitySchemes?.[schemeName];
  } else {
    return oas.securityDefinitions?.[schemeName];
  }
}

export function getSecuritySchemes(oas: BundledSwaggerOrOasSpec) {
  if (isOpenapi(oas)) {
    return oas.components?.securitySchemes || {};
  } else {
    return oas.securityDefinitions || {};
  }
}

export function getBasicSecuritySchemes(oas: BundledSwaggerOrOasSpec) {
  const schemes = getSecuritySchemes(oas);

  return Object.entries(schemes)
    .filter(([name, scheme]) => {
      return scheme.type === "http" && scheme.scheme === "basic";
    })
    .map(([name, scheme]) => name);
}
