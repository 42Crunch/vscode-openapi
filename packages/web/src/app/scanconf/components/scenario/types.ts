import { LookupFailure, LookupResult } from "@xliic/common/env";
import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import { MockHttpResponseType } from "../../../../core/playbook/mock-http";
import { RequestRef } from "@xliic/common/playbook";

export type OperationResult = {
  ref?: RequestRef;
  operationId?: string;
  httpRequest?: HttpRequest;
  httpRequestPrepareError?: string;
  httpResponse?: HttpResponse | MockHttpResponseType;
  httpError?: HttpError;
  auth: ExecutionResult;
  variablesReplaced?: {
    stack: PlaybookEnvStack;
    found: LookupResult[];
    missing: LookupFailure[];
  };
  variablesAssigned: PlaybookEnvStack;
  variableAssignmentError?: string;
  status: "pending" | "success" | "failure";
};

export type PlaybookResult = {
  playbook: string;
  status: "pending" | "success" | "failure";
  results: OperationResult[];
};

export type ExecutionResult = PlaybookResult[];
