import { HttpMethod, HttpMethods } from "./http";
import { deref, RefOr } from "./ref";

export type Spec = {
  openapi: "3.0.0" | "3.0.1" | "3.0.2" | "3.0.3";
  info: Info;
  tags?: Tag[];
  servers?: Server[];
  externalDocs?: ExternalDocumentation;
  paths: Record<string, PathItem>;
  webhooks?: Record<string, PathItem>;
  components?: Components;
  security?: SecurityRequirement[];
};

export type Components = {
  schemas?: { [name: string]: RefOr<Schema> };
  responses?: { [name: string]: RefOr<Response> };
  parameters?: { [name: string]: RefOr<Parameter> };
  examples?: { [name: string]: RefOr<Example> };
  requestBodies?: { [name: string]: RefOr<RequestBody> };
  headers?: { [name: string]: RefOr<Header> };
  securitySchemes?: { [name: string]: RefOr<SecurityScheme> };
  links?: { [name: string]: RefOr<Link> };
  callbacks?: { [name: string]: RefOr<Callback> };
};

export type PathItem = {
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;

  servers?: Server[];
  parameters?: Array<RefOr<Parameter>>;
  $ref?: string;
};

export type Operation = {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: Array<RefOr<Parameter>>;
  requestBody?: RefOr<RequestBody>;
  responses: Responses;
  callbacks?: { [name: string]: RefOr<Callback> };
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
};

export type Parameter = {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: RefOr<Schema>;
  example?: any;
  examples?: { [media: string]: RefOr<Example> };
  content?: { [media: string]: MediaType };
  encoding?: Record<string, Encoding>;
  const?: any;
};

export type Schema = {
  type?: string;
  properties?: { [name: string]: Schema };
  additionalProperties?: boolean | Schema;
  description?: string;
  default?: any;
  items?: RefOr<Schema>;
  required?: string[];
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  format?: string;
  externalDocs?: ExternalDocumentation;
  discriminator?: Discriminator;
  nullable?: boolean;
  oneOf?: Schema[];
  anyOf?: Schema[];
  allOf?: Schema[];
  not?: Schema;
  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean | number;
  minimum?: number;
  exclusiveMinimum?: boolean | number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  enum?: any[];
  example?: any;
  const?: string;
  contentEncoding?: string;
  contentMediaType?: string;
};

export type Server = {
  url: string;
  description?: string;
  variables?: { [name: string]: ServerVariable };
};

export type ServerVariable = {
  enum?: string[];
  default: string;
  description?: string;
};

export type ExternalDocumentation = {
  description?: string;
  url: string;
};

export type RequestBody = {
  description?: string;
  required?: boolean;
  content: { [mime: string]: MediaType };
};

export type Responses = {
  [code: string]: RefOr<Response>;
};

export type Response = {
  description: string;
  headers?: { [name: string]: RefOr<Header> };
  content?: { [mime: string]: MediaType };
  links?: { [name: string]: RefOr<Link> };
};

export type MediaType = {
  schema?: RefOr<Schema>;
  example?: any;
  examples?: { [name: string]: RefOr<Example> };
  encoding?: { [field: string]: Encoding };
};

export type Link = {
  operationRef?: string;
  operationId?: string;
  parameters?: { [name: string]: any };
  requestBody?: any;
  description?: string;
  server?: Server;
};

export type SecurityScheme = {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  description?: string;
  name: string;
  in: "query" | "header" | "cookie";
  scheme: string;
  bearerFormat?: string;
  flows: {
    implicit?: {
      refreshUrl?: string;
      scopes: { [name: string]: string };
      authorizationUrl: string;
    };
    password?: {
      refreshUrl?: string;
      scopes: { [name: string]: string };
      tokenUrl: string;
    };
    clientCredentials?: {
      refreshUrl?: string;
      scopes: { [name: string]: string };
      tokenUrl: string;
    };
    authorizationCode?: {
      refreshUrl?: string;
      scopes: { [name: string]: string };
      tokenUrl: string;
    };
  };
  openIdConnectUrl?: string;
};

export type SecurityRequirement = {
  [name: string]: string[];
};

export type Example = {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
};

export type Discriminator = {
  propertyName: string;
  mapping?: { [name: string]: string };
};

export type Encoding = {
  contentType: string;
  headers?: { [name: string]: RefOr<Header> };
  style: ParameterStyle;
  explode: boolean;
  allowReserved: boolean;
};

export type Tag = {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
};

export type Callback = {
  [name: string]: PathItem;
};

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
  identifier?: string;
};

export type Header = Omit<Parameter, "in" | "name">;

export type ParameterLocation = "query" | "header" | "path" | "cookie";

export type ParameterStyle =
  | "matrix"
  | "label"
  | "form"
  | "simple"
  | "spaceDelimited"
  | "pipeDelimited"
  | "deepObject";

// utility functions and types

export type BundledSpec = Spec & {
  paths: Record<string, ResolvedPathItem>;
  webhooks?: Record<string, ResolvedPathItem>;
  components?: ResolvedComponents;
};

export type ResolvedComponents = {
  schemas?: Record<string, Schema>;
  responses?: Record<string, Response>;
  parameters?: Record<string, Parameter>;
  examples?: Record<string, Example>;
  requestBodies?: Record<string, RequestBody>;
  headers?: Record<string, Header>;
  securitySchemes?: Record<string, RefOr<SecurityScheme>>;
  links?: Record<string, Link>;
  callbacks?: Record<string, Callback>;
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
  return deref(oas, oas.paths[path])?.[method];
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
  const result: OperationParametersMap = { query: {}, header: {}, path: {}, cookie: {} };

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

export const PrimitiveTypes = ["string", "number", "integer", "boolean"] as const;
export type PrimitiveType = (typeof PrimitiveTypes)[number];

export type VaueType =
  | { type: "primitive"; value: PrimitiveType }
  | { type: "array"; items: PrimitiveType | "unknown" }
  | { type: "object" };

export function getServerUrls(oas: Spec): string[] {
  const servers = (oas.servers ?? [])
    .filter((server) => server.url !== undefined && server.url !== "")
    .map((server) => server.url);

  if (servers.length > 0) {
    return servers;
  }
  return ["http://localhost/"];
}
