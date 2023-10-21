import { HttpClient, HttpError, HttpMethod, HttpRequest, HttpResponse } from "@xliic/common/http";
import { RequestRef, Credential } from "@xliic/common/playbook";

import { LookupResult, LookupFailure } from "@xliic/common/env";
import { PlaybookEnvStack } from "./playbook-env";
import { MockHttpResponseType } from "./mock-http";

export type AuthResult = Record<string, { credential: Credential; value: string }>;

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

export type PlaybookVariablesAssignmentError = {
  event: "variables-assignment-error";
  error: string;
};

export type PlaybookExecutorStep =
  | PlaybookStarted
  | AuthStarted
  | AuthFinished
  | RequestStarted
  | PlaybookFinished
  | PlaybookAborted
  | PlaybookPayloadVariablesReplaced
  | PlaybookCredentialVariablesReplaced
  | PlaybookHttpRequestPrepared
  | PlaybookHttpRequestPrepareError
  | PlaybookHttpResponseReceived
  | PlaybookHttpErrorReceived
  | PlaybookVariablesAssigned
  | PlaybookVariablesAssignmentError;

export type Executor = (
  client: HttpClient,
  playbook: Playbook
) => AsyncGenerator<PlaybookExecutorStep>;
