import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { AuthResult } from "./playbook";
import { MockHttpResponseType } from "../http-client/mock-client";

export const TestEventNames = ["test-failed"] as const;
export type TestEvent = (typeof TestEventNames)[number];

export type TestFailed = {
  event: "test-failed";
  message: string;
};

export function isTestStep(step: unknown): step is TestStep {
  return TestEventNames.includes((step as TestFailed)?.event);
}

export type Hooks = {
  security?: (auth: AuthResult) => AsyncGenerator<never, AuthResult, void>;
  request?: (request: HttpRequest) => AsyncGenerator<never, HttpRequest, void>;
  response?: (
    response: HttpResponse | MockHttpResponseType
  ) => AsyncGenerator<TestFailed, HttpResponse | MockHttpResponseType, void>;
  error?: (error: HttpError) => AsyncGenerator<TestFailed, HttpError, void>;
};

type YieldOf<T> = T extends AsyncGenerator<infer Y, any, any> ? Y : never;
export type TestStep = YieldOf<ReturnType<NonNullable<Hooks[keyof Hooks]>>>;
