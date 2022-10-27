import {
  BundledOpenApiSpec,
  OasOperation,
  OasPathItem,
  OasParameter,
  getServerUrls as getOasServerUrls,
} from "./oas30";
import {
  BundledSwaggerSpec,
  SwaggerOperation,
  SwaggerPathItem,
  SwaggerParameter,
  getServerUrls as getSwaggerServerUrls,
} from "./swagger";
import { HttpMethod } from "./http";
import { deref } from "./ref";

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

export function getServerUrls(oas: BundledSwaggerOrOasSpec): string[] {
  return isOpenapi(oas) ? getOasServerUrls(oas) : getSwaggerServerUrls(oas);
}
