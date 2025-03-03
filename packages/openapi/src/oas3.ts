import { HttpMethod, HttpMethods } from "./http";
import { deref } from "./ref";
import * as OpenApi30 from "./oas30";
import * as OpenApi31 from "./oas31";

type BundledSpec = OpenApi30.BundledSpec | OpenApi31.BundledSpec;
type OasParameter<T> = T extends OpenApi30.BundledSpec ? OpenApi30.Parameter : OpenApi31.Parameter;

export function getOperation<T extends BundledSpec>(
  oas: T,
  path: string,
  method: HttpMethod
): T extends OpenApi30.BundledSpec
  ? OpenApi30.Operation | undefined
  : OpenApi31.Operation | undefined {
  return deref(oas, oas.paths?.[path])?.[method] as any;
}

export function getPathItemParameters<T extends BundledSpec>(
  oas: T,
  pathItem: T extends OpenApi30.BundledSpec ? OpenApi30.PathItem : OpenApi31.PathItem
): OasParameter<T>[] {
  const params = pathItem.parameters ?? [];
  return params.map((param) => deref(oas, param)!) as any;
}

export function getOperationParameters<T extends BundledSpec>(
  oas: T,
  operation:
    | (T extends OpenApi30.BundledSpec ? OpenApi30.Operation : OpenApi31.Operation)
    | undefined
): OasParameter<T>[] {
  const params = operation?.parameters ?? [];
  return params.map((param) => deref(oas, param)!) as any;
}

export function getOperations<T extends BundledSpec>(
  oas: T
): [
  string,
  HttpMethod,
  T extends OpenApi30.BundledSpec ? OpenApi30.Operation : OpenApi31.Operation
][] {
  const operations: [
    string,
    HttpMethod,
    T extends OpenApi30.BundledSpec ? OpenApi30.Operation : OpenApi31.Operation
  ][] = [];
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

export function getServerUrls(oas: OpenApi30.Spec | OpenApi31.Spec): string[] {
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
): {
  query: { [name: string]: OasParameter<T> };
  header: { [name: string]: OasParameter<T> };
  path: { [name: string]: OasParameter<T> };
  cookie: { [name: string]: OasParameter<T> };
} {
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
