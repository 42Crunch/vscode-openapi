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

export type HttpMethod = typeof HttpMethods[number];

export interface HttpRequest {
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
  httpVersion: string;
  statusCode: number;
  statusMessage?: string;
  headers: [string, string][];
  body?: string;
}
