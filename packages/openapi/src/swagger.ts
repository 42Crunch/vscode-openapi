import { HttpMethod, HttpMethods } from "./http";
import { deref, RefOr } from "./ref";

export type Spec = {
  swagger: "2.0";
  info: Info;
  host?: string;
  basePath?: string;
  schemes?: UrlScheme[];
  consumes?: string[];
  produces?: string[];
  paths: Record<string, PathItem>;
  definitions?: Record<string, RefOr<Schema>>;
  parameters?: Record<string, RefOr<Parameter>>;
  responses?: Record<string, RefOr<Response>>;
  securityDefinitions?: Record<string, SecurityScheme>;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
};

type UrlScheme = "http" | "https" | "ws" | "wss";

export type Info = {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
};

export type Contact = {
  name?: string;
  url?: string;
  email?: string;
};

export type License = {
  name: string;
  url?: string;
};

export type ExternalDocumentation = {
  description?: string;
  url: string;
};

export type Tag = {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
};

export type SecurityRequirement = {
  [name: string]: string[];
};

export type ParameterLocation = "query" | "header" | "path" | "formData" | "body";

export type PathItem = {
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  parameters?: Array<RefOr<Parameter>>;
  $ref?: string;
};

export type Operation = {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  consumes?: string[];
  produces?: string[];
  parameters?: Array<RefOr<Parameter>>;
  responses: Responses;
  schemes?: UrlScheme[];
  deprecated?: boolean;
  security?: SecurityRequirement[];
};

export type Parameter = {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  // If in is "body"
  schema?: RefOr<Schema>;
  // If in is any value other than "body":
  type?: "string" | "number" | "integer" | "boolean" | "array" | "file";
  format?: string;
  allowEmptyValue?: boolean;
  items?: RefOr<Schema>;
  collectionFormat: "csv" | "ssv" | "tsv" | "pipes" | "multi";
  default?: unknown;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  enum?: unknown[];
  multipleOf?: number;
};

export type Schema = {
  type?: string;
  properties?: { [name: string]: Schema };
  additionalProperties?: boolean | Schema;
  description?: string;
  default?: unknown;
  items?: RefOr<Schema>;
  required?: string[];
  readOnly?: boolean;
  format?: string;
  externalDocs?: ExternalDocumentation;
  discriminator?: string;
  allOf?: Schema[];
  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  enum?: unknown[];
  example?: unknown;
};

export type Responses = {
  [code: string]: RefOr<Response>;
};

export type Response = {
  description: string;
  schema?: RefOr<Schema>;
  headers?: { [name: string]: RefOr<Header> };
  examples?: { [name: string]: unknown };
};

export type Header = {
  description?: string;
  type: "string" | "number" | "integer" | "boolean" | "array" | "file";
  format?: string;
  items?: unknown; // TODO
  collectionFormat: "csv" | "ssv" | "tsv" | "pipes" | "multi";
  default?: unknown;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  enum?: unknown[];
  multipleOf?: number;
};

export type SecurityScheme = {
  type: "apiKey" | "basic" | "oauth";
  description?: string;
  name: string;
  in: "query" | "header";
  flow: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: Record<string, string>;
};

export type BundledSpec = Spec & {
  paths: Record<string, ResolvedPathItem>;
  definitions?: Record<string, Schema>;
  parameters?: Record<string, Parameter>;
  responses?: Record<string, Response>;
};

export type ResolvedPathItem = Omit<PathItem, "$ref">;

export type ResolvedParameter = Parameter & {
  schema?: Schema;
};

export type OperationParametersMap = Record<ParameterLocation, Record<string, ResolvedParameter>>;

export type ResolvedOperationSecurity = Record<string, SecurityScheme>[];

export function getOperation(
  oas: BundledSpec,
  path: string,
  method: HttpMethod
): Operation | undefined {
  if (method === "trace") {
    // not 'trace' method in Swagger spec
    return undefined;
  }
  return deref(oas, oas.paths[path])?.[method];
}

export function getOperations(oas: BundledSpec): [string, HttpMethod, Operation][] {
  const operations: [string, HttpMethod, Operation][] = [];
  for (const path of Object.keys(oas.paths)) {
    for (const method of Object.keys(oas.paths[path])) {
      if (HttpMethods.includes(method as HttpMethod)) {
        const operation = getOperation(oas, path, method as HttpMethod)!;
        operations.push([path, method as HttpMethod, operation]);
      }
    }
  }
  return operations;
}

export function getPathItemParameters(oas: BundledSpec, pathItem: PathItem): Parameter[] {
  const params = pathItem.parameters ?? [];
  return params.map((param) => deref(oas, param)!);
}

export function getOperationParameters(
  oas: BundledSpec,
  operation: Operation | undefined
): Parameter[] {
  const params = operation?.parameters ?? [];
  return params.map((param) => deref(oas, param)!);
}

export function getParametersMap(
  oas: BundledSpec,
  pathParameters: Parameter[],
  operationParameters: Parameter[]
): OperationParametersMap {
  const result: OperationParametersMap = {
    query: {},
    header: {},
    path: {},
    formData: {},
    body: {},
  };

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

export function getServerUrls(oas: Spec): string[] {
  const schemes = oas.schemes ?? ["http"];
  const basePath = oas.basePath ?? "";
  const host = oas.host ?? "localhost";

  return schemes.map((scheme) => `${scheme}://${host}${basePath}`);
}

export function getConsumes(oas: Spec, operation: Operation): string[] {
  if (operation?.consumes && operation.consumes.length > 0) {
    return operation.consumes;
  }
  if (oas?.consumes && oas.consumes.length > 0) {
    return oas.consumes;
  }
  return [];
}
