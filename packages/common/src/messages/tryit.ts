import { HttpMethod, HttpRequest, HttpResponse } from "../http";
import type { BundledOpenApiSpec, OasParameterLocation, OasSecurityScheme } from "../oas30";

export interface TryitConfig {
  insecureSslHostnames: string[];
}

export interface OasWithOperation {
  oas: BundledOpenApiSpec;
  path: string;
  method: HttpMethod;
  preferredMediaType?: string;
  preferredBodyValue?: unknown;
  config: TryitConfig;
}

export interface ErrorMessage {
  message: string;
  code: string;
  sslError: boolean;
}

export type TryitParameterValues = Record<OasParameterLocation, Record<string, unknown>>;

export type TryitOperationBodies = Record<string, any>;

export interface TryitOperationBody {
  mediaType: string;
  value: unknown;
}

export type TryitSecurityValueApiKey = string;
export type TryitSecurityValueHttp = { username: string; password: string };
export type TryitSecurityValue = TryitSecurityValueApiKey | TryitSecurityValueHttp;
export type TryitSecurityValues = Record<string, TryitSecurityValue>[];

export interface TryitOperationValues {
  parameters: TryitParameterValues;
  security: TryitSecurityValues;
  securityIndex: number;
  body?: TryitOperationBody;
  server: string;
}

export type TryitSecurity = Record<string, OasSecurityScheme>[];

// vs code to webapp requests
type TryOperationMessage = { command: "tryOperation"; payload: OasWithOperation };
type ShowResponseMessage = { command: "showResponse"; payload: HttpResponse };
type ShowErrorMessage = { command: "showError"; payload: ErrorMessage };

export type TryItRequest = TryOperationMessage | ShowResponseMessage | ShowErrorMessage;

// webapp to vs code responses
type SendHttpRequestMessage = { command: "sendRequest"; payload: HttpRequest };
type CreateSchemaCommandMessage = { command: "createSchema"; payload: any };
type SaveConfigMessage = { command: "saveConfig"; payload: TryitConfig };

export type TryItResponse = SendHttpRequestMessage | CreateSchemaCommandMessage | SaveConfigMessage;
