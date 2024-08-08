import { HttpMethod } from "@xliic/openapi";

export type PlatformRequest = {
  path: string;
  method: HttpMethod;
  body?: unknown;
};

export type PlatformResponse = {
  statusCode: number;
  headers: [string, string][];
  body?: string;
};

export type PlatformError = {
  message: string;
  code: string;
};

export type SendPlatformRequestMessage = {
  command: "sendPlatformRequest";
  payload: { id: string; request: PlatformRequest };
};

export type ReceivePlatformResponseMessage = {
  command: "receivePlatformResponse";
  payload: { id: string; response: PlatformResponse };
};

export type ReceivePlatformErrorMessage = {
  command: "receivePlatformError";
  payload: { id: string; error: PlatformError };
};
