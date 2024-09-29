import { HttpError, HttpRequest } from "@xliic/common/http";
import { NullableResult } from "@xliic/result";

export const MockHttpResponse = null;

export type MockHttpResponseType = typeof MockHttpResponse;

export type MockHttpClient = (
  request: HttpRequest
) => Promise<NullableResult<MockHttpResponseType, HttpError>>;

export function mockHttpClient(): MockHttpClient {
  return async () => [MockHttpResponse, undefined];
}
