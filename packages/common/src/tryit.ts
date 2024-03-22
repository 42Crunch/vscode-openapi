import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";

export interface OasWithOperation {
  oas: BundledSwaggerOrOasSpec;
  path: string;
  method: HttpMethod;
  preferredMediaType?: string;
  preferredBodyValue?: unknown;
}

export type TryItParameterLocation = "query" | "header" | "path" | "cookie";
export type TryitParameterValues = Record<TryItParameterLocation, Record<string, unknown>>;

export type TryitOperationBodies = Record<string, any>;

export interface TryitOperationBody {
  mediaType: string;
  value: unknown;
}

export type TryitSecurityValueApiKey = string;
export type TryitSecurityValueHttp = { username: string; password: string };
export type TryitSecurityValue = TryitSecurityValueApiKey | TryitSecurityValueHttp;
export type TryitSecurityValues = Record<string, TryitSecurityValue>;
export type TryitSecurityAllValues = TryitSecurityValues[];

export interface TryitOperationValues {
  parameters: TryitParameterValues;
  security: TryitSecurityAllValues;
  securityIndex: number;
  body?: TryitOperationBody;
  server: string;
}

// vs code to webapp requests
export type TryOperationMessage = { command: "tryOperation"; payload: OasWithOperation };

// webapp to vs code responses
export type CreateSchemaCommandMessage = { command: "createSchema"; payload: any };
