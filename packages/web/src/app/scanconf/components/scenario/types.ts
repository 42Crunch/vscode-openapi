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
  auth: Record<string, PlaybookResult>;
  variablesReplaced?: {
    found: LookupResult[];
    missing: LookupFailure[];
  };
  variablesAssigned: PlaybookEnvStack;
};

export type PlaybookResult = {
  results: OperationResult[];
  context: unknown;
};
