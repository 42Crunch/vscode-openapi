import { HttpMethod, HttpMethods } from "./http";
import { deref, RefOr } from "./ref";

export interface SwaggerSpec {
  swagger: "2.0";
  info: SwaggerInfo;
  host?: string;
  basePath?: string;
  schemes?: SwaggerScheme[];
  consumes?: string[];
  produces?: string[];
  paths: Record<string, SwaggerPathItem>;
  definitions?: Record<string, RefOr<SwaggerSchema>>;
  parameters?: Record<string, RefOr<SwaggerParameter>>;
  responses?: Record<string, RefOr<SwaggerResponse>>;
  securityDefinitions?: Record<string, SwaggerSecurityScheme>;
  security?: SwaggerSecurityRequirement[];
  tags?: SwaggerTag[];
  externalDocs?: SwaggerExternalDocumentation;
}

type SwaggerScheme = "http" | "https" | "ws" | "wss";

export interface SwaggerInfo {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: SwaggerContact;
  license?: SwaggerLicense;
  version: string;
}

export interface SwaggerContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface SwaggerLicense {
  name: string;
  url?: string;
}

export interface SwaggerExternalDocumentation {
  description?: string;
  url: string;
}

export interface SwaggerTag {
  name: string;
  description?: string;
  externalDocs?: SwaggerExternalDocumentation;
}

export interface SwaggerSecurityRequirement {
  [name: string]: string[];
}

export type SwaggerParameterLocation = "query" | "header" | "path" | "formData" | "body";

export interface SwaggerPathItem {
  get?: SwaggerOperation;
  put?: SwaggerOperation;
  post?: SwaggerOperation;
  delete?: SwaggerOperation;
  options?: SwaggerOperation;
  head?: SwaggerOperation;
  patch?: SwaggerOperation;
  parameters?: Array<RefOr<SwaggerParameter>>;
  $ref?: string;
}

export interface SwaggerOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: SwaggerExternalDocumentation;
  operationId?: string;
  consumes?: string[];
  produces?: string[];
  parameters?: Array<RefOr<SwaggerParameter>>;
  responses: SwaggerResponses;
  schemes?: SwaggerScheme[];
  deprecated?: boolean;
  security?: SwaggerSecurityRequirement[];
}

export interface SwaggerParameter {
  name: string;
  in: SwaggerParameterLocation;
  description?: string;
  required?: boolean;
  // If in is "body"
  schema?: RefOr<SwaggerSchema>;
  // If in is any value other than "body":
  type?: "string" | "number" | "integer" | "boolean" | "array" | "file";
  format?: string;
  allowEmptyValue?: boolean;
  items?: RefOr<SwaggerSchema>;
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
}

export interface SwaggerSchema {
  type?: string;
  properties?: { [name: string]: SwaggerSchema };
  additionalProperties?: boolean | SwaggerSchema;
  description?: string;
  default?: unknown;
  items?: RefOr<SwaggerSchema>;
  required?: string[];
  readOnly?: boolean;
  format?: string;
  externalDocs?: SwaggerExternalDocumentation;
  discriminator?: string;
  allOf?: SwaggerSchema[];
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
}

export interface SwaggerResponses {
  [code: string]: RefOr<SwaggerResponse>;
}

export interface SwaggerResponse {
  description: string;
  schema?: RefOr<SwaggerSchema>;
  headers?: { [name: string]: RefOr<SwaggerHeader> };
  examples?: { [name: string]: unknown };
}

export interface SwaggerHeader {
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
}

export interface SwaggerSecurityScheme {
  type: "apiKey" | "basic" | "oauth";
  description?: string;
  name: string;
  in: "query" | "header";
  flow: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: Record<string, string>;
}

export interface BundledSwaggerSpec extends SwaggerSpec {
  paths: Record<string, ResolvedSwaggerPathItem>;
  definitions?: Record<string, SwaggerSchema>;
  parameters?: Record<string, SwaggerParameter>;
  responses?: Record<string, SwaggerResponse>;
}

export type ResolvedSwaggerPathItem = Omit<SwaggerPathItem, "$ref">;

export interface ResolvedSwaggerParameter extends SwaggerParameter {
  schema?: SwaggerSchema;
}

export type OperationParametersMap = Record<
  SwaggerParameterLocation,
  Record<string, ResolvedSwaggerParameter>
>;

export type ResolvedSwaggerOperationSecurity = Record<string, SwaggerSecurityScheme>[];

export function getOperation(
  oas: BundledSwaggerSpec,
  path: string,
  method: HttpMethod
): SwaggerOperation | undefined {
  if (method === "trace") {
    // not 'trace' method in Swagger spec
    return undefined;
  }
  return deref(oas, oas.paths[path])?.[method];
}

export function getOperations(oas: BundledSwaggerSpec): [string, HttpMethod, SwaggerOperation][] {
  const operations: [string, HttpMethod, SwaggerOperation][] = [];
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

export function getPathItemParameters(
  oas: BundledSwaggerSpec,
  pathItem: SwaggerPathItem
): SwaggerParameter[] {
  const params = pathItem.parameters ?? [];
  return params.map((param) => deref(oas, param)!);
}

export function getOperationParameters(
  oas: BundledSwaggerSpec,
  operation: SwaggerOperation | undefined
): SwaggerParameter[] {
  const params = operation?.parameters ?? [];
  return params.map((param) => deref(oas, param)!);
}

export function getParametersMap(
  oas: BundledSwaggerSpec,
  pathParameters: SwaggerParameter[],
  operationParameters: SwaggerParameter[]
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

export function getServerUrls(oas: SwaggerSpec): string[] {
  const schemes = oas.schemes ?? ["http"];
  const basePath = oas.basePath ?? "";
  const host = oas.host ?? "localhost";

  return schemes.map((scheme) => `${scheme}://${host}${basePath}`);
}

export function getConsumes(oas: SwaggerSpec, operation: SwaggerOperation): string[] {
  if (operation?.consumes && operation.consumes.length > 0) {
    return operation.consumes;
  }
  if (oas?.consumes && oas.consumes.length > 0) {
    return oas.consumes;
  }
  return [];
}
