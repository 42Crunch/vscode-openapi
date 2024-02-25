import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { Result } from "@xliic/result";

export async function httpClient(request: HttpRequest): Promise<Result<HttpResponse, HttpError>> {
  try {
    const received = await executeHttpRequest(request);
    return [received, undefined];
  } catch (ex) {
    return [undefined, ex as HttpError];
  }
}

export async function executeHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  const { url, method, headers, body } = request;

  // does not support multipart form for now

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body as any,
    });

    return {
      httpVersion: "1.1",
      statusCode: response.status,
      statusMessage: response.statusText,
      headers: Array.from(response.headers),
      body: await response.text(),
    };
  } catch (e: unknown) {
    throw {
      code: "oops",
      message: `${e}`,
      sslError: false,
    };
  }
}

function isMultipartFormData(body: unknown, contentType: string | undefined) {
  return body && contentType === "multipart/form-data";
}
