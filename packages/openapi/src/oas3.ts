import { HttpMethod, HttpMethods } from "./http";
import { deref } from "./ref";
import * as OpenApi30 from "./oas30";
import * as OpenApi31 from "./oas31";

export type BundledSpec = OpenApi30.BundledSpec | OpenApi31.BundledSpec;

export type OasParameter<T> = T extends OpenApi30.BundledSpec
  ? OpenApi30.ResolvedParameter
  : OpenApi31.ResolvedParameter;

export type ResolvedOperationSecurity<T> = T extends OpenApi30.BundledSpec
  ? OpenApi30.ResolvedOperationSecurity
  : OpenApi31.ResolvedOperationSecurity;

export type SecurityScheme<T> = T extends OpenApi30.BundledSpec
  ? OpenApi30.SecurityScheme
  : OpenApi31.SecurityScheme;

export type Operation<T> = T extends OpenApi30.BundledSpec
  ? OpenApi30.Operation
  : OpenApi31.Operation;

export type OperationParametersMap<T> = T extends OpenApi30.BundledSpec
  ? OpenApi30.OperationParametersMap
  : OpenApi31.OperationParametersMap;

export function getOperation<T extends BundledSpec>(
  oas: T,
  path: string,
  method: HttpMethod
): Operation<T> | undefined {
  return deref(oas, oas.paths?.[path])?.[method] as any;
}

export function getPathItemParameters<T extends BundledSpec>(
  oas: T,
  pathItem: OpenApi30.ResolvedPathItem | OpenApi31.ResolvedPathItem
): OasParameter<T>[] {
  const params = pathItem.parameters ?? [];
  return params.map((param) => deref(oas, param)!) as any;
}

export function getOperationParameters<T extends BundledSpec>(
  oas: T,
  operation: Operation<T> | undefined
): OasParameter<T>[] {
  const params = operation?.parameters ?? [];
  return params.map((param) => deref(oas, param)!) as any;
}

export function getOperations<T extends BundledSpec>(oas: T): [string, HttpMethod, Operation<T>][] {
  const operations: [string, HttpMethod, Operation<T>][] = [];
  for (const path of Object.keys(oas.paths ?? {})) {
    for (const method of Object.keys(oas.paths?.[path] ?? {})) {
      if (HttpMethods.includes(method as HttpMethod)) {
        const operation = getOperation(oas, path, method as HttpMethod)!;
        operations.push([path, method as HttpMethod, operation as any]);
      }
    }
  }
  return operations;
}

export function getServerUrls(oas: BundledSpec): string[] {
  const servers = (oas.servers ?? [])
    .filter((server) => server.url !== undefined && server.url !== "")
    .map((server) => server.url);

  if (servers.length > 0) {
    return servers;
  }
  return ["http://localhost/"];
}

export function getParametersMap<T extends BundledSpec>(
  oas: T,
  pathParameters: OasParameter<T>[],
  operationParameters: OasParameter<T>[]
): OperationParametersMap<T> {
  const result = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  } as any;

  // path parameters first, to allow them to be overriden
  for (const parameter of pathParameters) {
    const schema = deref(oas, parameter.schema);
    result[parameter.in][parameter.name] = { ...parameter, schema };
  }

  // potentially override path parameters using ones defined in the operation itself
  for (const parameter of operationParameters) {
    const schema = deref(oas, parameter.schema);
    result[parameter.in][parameter.name] = { ...parameter, schema };
  }

  return result;
}

export function getSecurity<T extends BundledSpec>(
  oas: T,
  path: string,
  method: HttpMethod
): ResolvedOperationSecurity<T> {
  const operation = getOperation(oas, path, method);
  const requirements = operation?.security ?? oas.security ?? [];
  const result: ResolvedOperationSecurity<T> = [];
  for (const requirement of requirements) {
    const resolved: Record<string, unknown> = {};
    for (const schemeName of Object.keys(requirement)) {
      // check if the requsted security scheme is defined in the OAS
      if (oas?.components?.securitySchemes?.[schemeName]) {
        const scheme = deref<unknown>(oas, oas.components.securitySchemes[schemeName]);
        if (scheme) {
          resolved[schemeName] = scheme;
        }
      }
    }
    result.push(resolved as any);
  }
  return result;
}
