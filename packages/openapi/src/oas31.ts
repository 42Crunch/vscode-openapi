import { HttpMethod, HttpMethods } from "./http";
import { deref, RefOr } from "./ref";

export type Spec = {
  openapi: "3.1.0" | "3.1.1";
  info: Info;
  jsonSchemaDialect?: string;
  tags?: Tag[];
  servers?: Server[];
  externalDocs?: ExternalDocumentation;
  paths?: Record<string, PathItem>;
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
  pathItems?: { [name: string]: RefOr<PathItem> };
};

export type Info = {
  title: string;
  summary?: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
};

export type License = {
  name: string;
  identifier?: string;
  url?: string;
};

export type Schema = {
  $id?: string;
  $schema?: string;
  $anchor?: string;
  $vocabulary?: string;
  $ref?: string;
  $defs?: { [key: string]: Schema };
  title?: string;
  type?: SchemaType | SchemaType[];
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
  oneOf?: Schema[];
  anyOf?: Schema[];
  allOf?: Schema[];
  not?: Schema;
  if?: Schema;
  then?: Schema;
  else?: Schema;
  dependentSchemas?: Record<string, Schema>;
  dependentRequired?: Record<string, string[]>;
  prefixItems?: Schema[];
  contains?: Schema;
  minContains?: number;
  maxContains?: number;
  propertyNames?: Schema;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  enum?: any[];
  const?: any;
  examples?: any[];
  contentEncoding?: string;
  contentMediaType?: string;
  contentSchema?: Schema;
  $comment?: string;
  patternProperties?: Record<string, Schema>;
  unevaluatedItems?: boolean | Schema;
  unevaluatedProperties?: boolean | Schema;
};

type SchemaType = "null" | "boolean" | "object" | "array" | "number" | "string" | "integer";

export type SecurityScheme = {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS";
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
};

export type OAuthFlows = {
  implicit?: OAuth2ImplicitFlow;
  password?: OAuth2PasswordFlow;
  clientCredentials?: OAuth2ClientCredentialsFlow;
  authorizationCode?: OAuth2AuthorizationCodeFlow;
};

type OAuth2Flow = {
  refreshUrl?: string;
  scopes: Record<string, string>;
};

type OAuth2ImplicitFlow = OAuth2Flow & {
  authorizationUrl: string;
};

type OAuth2PasswordFlow = OAuth2Flow & {
  tokenUrl: string;
};

type OAuth2ClientCredentialsFlow = OAuth2Flow & {
  tokenUrl: string;
};

type OAuth2AuthorizationCodeFlow = OAuth2Flow & {
  authorizationUrl: string;
  tokenUrl: string;
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
};

export type RequestBody = {
  description?: string;
  required?: boolean;
  content: { [mime: string]: MediaType };
};

export type Response = {
  description: string;
  headers?: { [name: string]: RefOr<Header> };
  content?: { [mime: string]: MediaType };
  links?: { [name: string]: RefOr<Link> };
};

export type Responses = {
  [code: string]: RefOr<Response>;
};

export type SecurityRequirement = {
  [name: string]: string[];
};

export type Callback = {
  [name: string]: PathItem;
};

export type Discriminator = {
  propertyName: string;
  mapping?: { [name: string]: string };
};

// Utility types and functions similar to oas30.ts
export type BundledSpec = Spec & {
  paths?: Record<string, ResolvedPathItem>;
  webhooks?: Record<string, ResolvedPathItem>;
  components?: ResolvedComponents;
};

export type ResolvedPathItem = Omit<PathItem, "$ref">;

export type ResolvedComponents = {
  schemas?: Record<string, Schema>;
  responses?: Record<string, Response>;
  parameters?: Record<string, Parameter>;
  examples?: Record<string, Example>;
  requestBodies?: Record<string, RequestBody>;
  headers?: Record<string, Header>;
  securitySchemes?: Record<string, SecurityScheme>;
  links?: Record<string, Link>;
  callbacks?: Record<string, Callback>;
  pathItems?: Record<string, PathItem>;
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

export type Tag = {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
};

export type ExternalDocumentation = {
  description?: string;
  url: string;
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

export type Contact = {
  name?: string;
  url?: string;
  email?: string;
};

export type MediaType = {
  schema?: RefOr<Schema>;
  example?: any;
  examples?: { [name: string]: RefOr<Example> };
  encoding?: { [field: string]: Encoding };
};

export type Encoding = {
  contentType: string;
  headers?: { [name: string]: RefOr<Header> };
  style: ParameterStyle;
  explode: boolean;
  allowReserved: boolean;
};

export type Example = {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
};

export type Header = Omit<Parameter, "in" | "name">;

export type Link = {
  operationRef?: string;
  operationId?: string;
  parameters?: { [name: string]: any };
  requestBody?: any;
  description?: string;
  server?: Server;
};

export type ParameterLocation = "query" | "header" | "path" | "cookie";

export type ParameterStyle =
  | "matrix"
  | "label"
  | "form"
  | "simple"
  | "spaceDelimited"
  | "pipeDelimited"
  | "deepObject";

export type ResolvedParameter = Parameter & {
  schema?: Schema;
};

export type OperationParametersMap = Record<ParameterLocation, Record<string, ResolvedParameter>>;

export type ResolvedOperationSecurity = Record<string, SecurityScheme>[];

// export function getParametersMap(
//   oas: BundledSpec,
//   pathParameters: Parameter[],
//   operationParameters: Parameter[]
// ): OperationParametersMap {
//   const result: OperationParametersMap = {
//     query: {},
//     header: {},
//     path: {},
//     cookie: {},
//   };

//   // path parameters first, to allow them to be overriden
//   for (const parameter of pathParameters) {
//     const schema = deref(oas, parameter.schema);
//     result[parameter.in][parameter.name] = { ...parameter, schema };
//   }

//   // potentially override path parameters using ones defined in the operation itself
//   for (const parameter of operationParameters) {
//     const schema = deref(oas, parameter.schema);
//     result[parameter.in][parameter.name] = { ...parameter, schema };
//   }

//   return result;
//}
