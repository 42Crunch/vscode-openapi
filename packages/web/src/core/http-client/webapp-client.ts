import {
  HttpClient,
  HttpConfig,
  HttpError,
  HttpRequest,
  HttpResponse,
  MtlsConfig,
} from "@xliic/common/http";
import { Result } from "@xliic/result";

export function webappHttpClient(
  config: HttpConfig,
  dispatch: (
    id: string,
    request: HttpRequest,
    config: HttpConfig,
    mtlsConfig: MtlsConfig | undefined
  ) => void
): HttpClient {
  return async function httpClient(
    request: HttpRequest,
    mtlsConfig: MtlsConfig | undefined
  ): Promise<Result<HttpResponse, HttpError>> {
    const id = crypto.randomUUID();
    const response = receive(id);
    dispatch(id, request, config, mtlsConfig);
    return response;
  };
}

async function receive(id: string): Promise<Result<HttpResponse, HttpError>> {
  return new Promise((resolve, reject) => {
    function messageHandler(event: any) {
      const { command, payload } = event.data;
      if (command === "showHttpResponse" && payload.id === id) {
        window.removeEventListener("message", messageHandler);
        resolve([payload.response, undefined]);
      } else if (command === "showHttpError" && payload.id === id) {
        window.removeEventListener("message", messageHandler);
        resolve([undefined, payload.error]);
      }
    }

    window.addEventListener("message", messageHandler);
  });
}
