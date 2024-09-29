import { HttpMethod } from "@xliic/openapi";
import { HttpClient, HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";
import { LookupResult, LookupFailure } from "@xliic/common/env";

import { PlaybookEnvStack } from "./playbook-env";
import { MockHttpResponseType } from "../http-client/mock-client";

export type AuthResult = Record<
  string,
  { credential: Playbook.Credential; value: string | undefined }
>;

export type Step = {
  path: string;
  method: HttpMethod;
};

export type Playbook = {
  steps: Step[];
};

export type PlaybookStarted = {
  event: "playbook-started";
  name: string;
};

export type RequestStarted = {
  event: "request-started";
  ref?: Playbook.RequestRef;
};

export type AuthStarted = {
  event: "auth-started";
  name: string;
};

export type AuthFinished = {
  event: "auth-finished";
};

export type AuthAborted = {
  event: "auth-aborted";
  error: string;
};

export type PlaybookFinished = {
  event: "playbook-finished";
};

export type PlaybookAborted = {
  event: "playbook-aborted";
  error: string;
};

export type PlaybookPayloadVariablesReplaced = {
  event: "payload-variables-substituted";
  stack: PlaybookEnvStack;
  found: LookupResult[];
  missing: LookupFailure[];
};

export type PlaybookCredentialVariablesReplaced = {
  event: "credential-variables-substituted";
  name: string;
  result: string;
  stack: PlaybookEnvStack;
  found: LookupResult[];
  missing: LookupFailure[];
};

export type PlaybookCredentialRetrievedFromCache = {
  event: "credential-retrieved-from-cache";
  name: string;
  result: string;
};

export type PlaybookHttpRequestPrepared = {
  event: "http-request-prepared";
  request: HttpRequest;
  operationId?: string;
};

export type PlaybookHttpRequestPrepareError = {
  event: "http-request-prepare-error";
  error: string;
};

export type PlaybookHttpResponseReceived = {
  event: "http-response-received";
  response: HttpResponse | MockHttpResponseType;
};

export type PlaybookHttpErrorReceived = {
  event: "http-error-received";
  error: HttpError;
};

export type PlaybookVariablesAssigned = {
  event: "variables-assigned";
  assignments: PlaybookEnvStack;
};

export type PlaybookResponseProcessingError = {
  event: "response-processing-error";
  error: string;
};

export type PlaybookExecutorStep =
  | PlaybookStarted
  | AuthStarted
  | AuthFinished
  | AuthAborted
  | RequestStarted
  | PlaybookFinished
  | PlaybookAborted
  | PlaybookPayloadVariablesReplaced
  | PlaybookCredentialVariablesReplaced
  | PlaybookCredentialRetrievedFromCache
  | PlaybookHttpRequestPrepared
  | PlaybookHttpRequestPrepareError
  | PlaybookHttpResponseReceived
  | PlaybookHttpErrorReceived
  | PlaybookVariablesAssigned
  | PlaybookResponseProcessingError;

export type Executor = (
  client: HttpClient,
  playbook: Playbook
) => AsyncGenerator<PlaybookExecutorStep>;
