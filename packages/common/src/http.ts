export const HttpMethods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

export type HttpMethod = (typeof HttpMethods)[number];

export interface HttpRequest {
  id?: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
  config: {
    https: {
      rejectUnauthorized: boolean;
    };
  };
}

export interface HttpResponse {
  id?: string;
  httpVersion: string;
  statusCode: number;
  statusMessage?: string;
  headers: [string, string][];
  body?: string;
}

export interface HttpError {
  id?: string;
  message: string;
  code: string;
  sslError: boolean;
}

export type SendHttpRequestMessage = { command: "sendHttpRequest"; payload: HttpRequest };
export type SendCurlRequestMessage = { command: "sendCurlRequest"; payload: string };
export type ShowHttpResponseMessage = { command: "showHttpResponse"; payload: HttpResponse };
export type ShowHttpErrorMessage = { command: "showHttpError"; payload: HttpError };
