import { Result } from "./result";

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

export type HttpRequest = {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
};

export type HttpResponse = {
  httpVersion: string;
  statusCode: number;
  statusMessage?: string;
  headers: [string, string][];
  body?: string;
};

export type HttpConfig = {
  https: {
    rejectUnauthorized: boolean;
  };
};

export type HttpError = {
  message: string;
  code: string;
  sslError: boolean;
};

export type HttpClient = (request: HttpRequest) => Promise<Result<HttpResponse, HttpError>>;

export type SendHttpRequestMessage = {
  command: "sendHttpRequest";
  payload: { id: string; request: HttpRequest; config: HttpConfig };
};

export type ShowHttpResponseMessage = {
  command: "showHttpResponse";
  payload: { id: string; response: HttpResponse };
};

export type ShowHttpErrorMessage = {
  command: "showHttpError";
  payload: { id: string; error: HttpError };
};

export type SendCurlRequestMessage = { command: "sendCurlRequest"; payload: string };
