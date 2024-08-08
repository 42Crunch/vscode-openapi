import { LookupFailure, LookupResult } from "@xliic/common/env";
import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";

import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import { MockHttpResponseType } from "../../../../core/http-client/mock-client";

export type VariableReplacement = {
  stack: PlaybookEnvStack;
  found: LookupResult[];
  missing: LookupFailure[];
};

export type ProgressState = "pending" | "success" | "failure";

export type AuthenticationResult = {
  execution: ExecutionResult;
  result?: string;
  variables?: VariableReplacement;
  error?: string;
};

export type OperationResult = {
  ref?: Playbook.RequestRef;
  operationId?: string;
  httpRequest?: HttpRequest;
  httpRequestPrepareError?: string;
  httpResponse?: HttpResponse | MockHttpResponseType;
  httpError?: HttpError;
  auth: Record<string, AuthenticationResult>;
  variablesReplaced?: VariableReplacement;
  variablesAssigned: PlaybookEnvStack;
  responseProcessingError?: string;
  status: ProgressState;
};

export type PlaybookResult = {
  name: string;
  status: ProgressState;
  error?: string;
  results: OperationResult[];
};

export type ExecutionResult = PlaybookResult[];
