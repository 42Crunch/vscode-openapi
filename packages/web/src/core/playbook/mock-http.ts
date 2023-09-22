import { HttpError, HttpRequest } from "@xliic/common/http";
import { NullableResult, Result } from "@xliic/common/result";

export const MockHttpResponse = null;

export type MockHttpResponseType = typeof MockHttpResponse;

export type MockHttpClient = (
  request: HttpRequest
) => Promise<NullableResult<MockHttpResponseType, HttpError>>;
