import { HttpError, HttpRequest } from "@xliic/common/http";
import { Result } from "@xliic/result";

export const MockHttpResponse: unique symbol = Symbol("MockHttpResponse");

export type MockHttpResponseType = typeof MockHttpResponse;

export type MockHttpClient = (
  request: HttpRequest
) => Promise<Result<MockHttpResponseType, HttpError>>;

export function mockHttpClient(): MockHttpClient {
  return async () => [MockHttpResponse, undefined];
}
