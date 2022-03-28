import { HttpMethod, HttpRequest, HttpResponse } from "../http";
import type { BundledOpenApiSpec, OasParameterLocation } from "../oas30";

export interface OasWithOperation {
  oas: BundledOpenApiSpec;
  path: string;
  method: HttpMethod;
}

export interface ErrorMessage {
  message: string;
}

export interface CurlCommand {
  curl: string;
}

export type ParameterValues = Record<OasParameterLocation, Record<string, unknown>>;

export type OperationBodies = Record<string, any>;

export interface OperationBody {
  mediaType: string;
  value: unknown;
}

export interface OperationValues {
  parameters: ParameterValues;
  body?: OperationBody;
  server: string;
}

// vs code to webapp requests
type TryOperationMessage = { command: "tryOperation"; payload: OasWithOperation };
type ShowResponseMessage = { command: "showResponse"; payload: HttpResponse };
type ShowErrorMessage = { command: "showError"; payload: ErrorMessage };

export type TryItRequest = TryOperationMessage | ShowResponseMessage | ShowErrorMessage;

// webapp to vs code responses
type SendHttpRequestMessage = { command: "sendRequest"; payload: HttpRequest };
type SendCurlCommandMessage = { command: "sendCurl"; payload: CurlCommand };

export type TryItResponse = SendHttpRequestMessage | SendCurlCommandMessage;
