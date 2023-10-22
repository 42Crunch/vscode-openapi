import { LookupFailure, LookupResult } from "@xliic/common/env";
import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import { MockHttpResponseType } from "../../../../core/playbook/mock-http";
import { RequestRef } from "@xliic/common/playbook";

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
  ref?: RequestRef;
  operationId?: string;
  httpRequest?: HttpRequest;
  httpRequestPrepareError?: string;
  httpResponse?: HttpResponse | MockHttpResponseType;
  httpError?: HttpError;
  auth: Record<string, AuthenticationResult>;
  variablesReplaced?: VariableReplacement;
  variablesAssigned: PlaybookEnvStack;
  variableAssignmentError?: string;
  status: ProgressState;
};

export type PlaybookResult = {
  playbook: string;
  status: ProgressState;
  results: OperationResult[];
};

export type ExecutionResult = PlaybookResult[];
