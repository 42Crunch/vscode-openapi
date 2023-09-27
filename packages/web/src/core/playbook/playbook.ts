import { HttpClient, HttpError, HttpMethod, HttpRequest, HttpResponse } from "@xliic/common/http";
import { RequestRef } from "@xliic/common/playbook";

import { LookupResult, LookupFailure } from "@xliic/common/env";
import { PlaybookEnvStack } from "./playbook-env";
import { MockHttpResponseType } from "./mock-http";

export type Step = {
  path: string;
  method: HttpMethod;
};

export type Playbook = {
  steps: Step[];
};

export type PlaybookStarted = {
  event: "playbook-started";
  name: "scenario" | "before" | "after";
};

export type RequestStarted = {
  event: "request-started";
  ref?: RequestRef;
};

export type AuthStarted = {
  event: "auth-started";
  name: string;
};

export type AuthFinished = {
  event: "auth-finished";
};

export type PlaybookFinished = {
  event: "playbook-finished";
};

export type PlaybookAborted = {
  event: "playbook-aborted";
};

export type PlaybookPayloadVariablesReplaced = {
  event: "payload-variables-substituted";
  found: LookupResult[];
  missing: LookupFailure[];
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

export type PlaybookExecutorStep =
  | PlaybookStarted
  | AuthStarted
  | AuthFinished
  | RequestStarted
  | PlaybookFinished
  | PlaybookAborted
  | PlaybookPayloadVariablesReplaced
  | PlaybookHttpRequestPrepared
  | PlaybookHttpRequestPrepareError
  | PlaybookHttpResponseReceived
  | PlaybookHttpErrorReceived
  | PlaybookVariablesAssigned;

export type Executor = (
  client: HttpClient,
  playbook: Playbook
) => AsyncGenerator<PlaybookExecutorStep>;
