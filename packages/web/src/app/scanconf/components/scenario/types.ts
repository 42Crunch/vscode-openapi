import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";

import {
  PlaybookEnvStack,
  PlaybookLookupResult,
  PlaybookLookupFailure,
} from "../../../../core/playbook/playbook-env";

export type VariableReplacement = {
  stack: PlaybookEnvStack;
  found: PlaybookLookupResult[];
  missing: PlaybookLookupFailure[];
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
  httpResponse?: HttpResponse;
  httpError?: HttpError;
  auth: Record<string, AuthenticationResult>;
  variablesReplaced?: VariableReplacement;
  variablesAssigned: PlaybookEnvStack;
  responseProcessingError?: string;
  status: ProgressState;
  playbookMessage?: string;
};

export type PlaybookResult = {
  name: string;
  status: ProgressState;
  error?: string;
  results: OperationResult[];
};

export type ExecutionResult = PlaybookResult[];
