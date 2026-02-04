import {
  PlaybookExecutorStep,
  AuthFinished,
  AuthStarted,
  PlaybookAborted,
  PlaybookFinished,
  PlaybookHttpErrorReceived,
  PlaybookHttpRequestPrepareError,
  PlaybookHttpRequestPrepared,
  PlaybookHttpResponseReceived,
  PlaybookPayloadVariablesReplaced,
  PlaybookStarted,
  PlaybookVariablesAssigned,
  PlaybookResponseProcessingError,
  RequestStarted,
  PlaybookCredentialVariablesReplaced,
  AuthAborted,
  PlaybookCredentialRetrievedFromCache,
} from "../../core/playbook/playbook";
import { ExecutionResult, OperationResult, PlaybookResult } from "./components/scenario/types";

type PlaybookEventHandlers = {
  [K in PlaybookExecutorStep["event"]]: (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: Extract<PlaybookExecutorStep, { event: K }>
  ) => void;
};

export type Current = {
  auth: string[];
};

function currentExecutionResult(
  stateCurrent: Current,
  stateResult: ExecutionResult
): ExecutionResult {
  if (stateCurrent.auth.length === 0) {
    return stateResult;
  }
  const [auth, ...remainingAuth] = stateCurrent.auth;
  const playbook = last(stateResult);
  const operation = last(playbook.results);
  return currentExecutionResult({ auth: remainingAuth }, operation.auth[auth].execution);
}

function currentPlaybook(stateCurrent: Current, stateResult: ExecutionResult): PlaybookResult {
  return last(currentExecutionResult(stateCurrent, stateResult));
}

function currentOperation(stateCurrent: Current, stateResult: ExecutionResult): OperationResult {
  return last(currentPlaybook(stateCurrent, stateResult).results);
}

function currentAuthentingOperation(
  stateCurrent: Current,
  stateResult: ExecutionResult
): OperationResult {
  const auth = stateCurrent.auth.slice(0, -1);
  return last(last(currentExecutionResult({ auth }, stateResult)).results);
}

const PlaybookStepHandlers: PlaybookEventHandlers = {
  "playbook-started": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookStarted
  ): void {
    currentExecutionResult(stateCurrent, stateResult).push({
      name: event.name,
      status: "pending",
      results: [],
    });
  },

  "request-started": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: RequestStarted
  ): void {
    currentPlaybook(stateCurrent, stateResult).results.push({
      ref: event.ref,
      auth: {},
      variablesAssigned: [],
      status: "pending",
    });
  },

  "auth-started": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: AuthStarted
  ): void {
    currentOperation(stateCurrent, stateResult).auth[event.name] = {
      execution: [],
    };
    stateCurrent.auth.push(event.name);
  },

  "auth-finished": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: AuthFinished
  ): void {
    stateCurrent.auth.pop();
  },

  "auth-aborted": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: AuthAborted
  ): void {
    const auth = stateCurrent.auth.pop();
    currentOperation(stateCurrent, stateResult).auth[auth!].error = event.error;
  },

  "playbook-finished": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookFinished
  ): void {
    currentPlaybook(stateCurrent, stateResult).status = "success";
  },

  "playbook-aborted": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookAborted
  ): void {
    const playbook = currentPlaybook(stateCurrent, stateResult);
    playbook.status = "failure";
    playbook.error = event.error;
  },

  "payload-variables-substituted": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookPayloadVariablesReplaced
  ): void {
    currentOperation(stateCurrent, stateResult).variablesReplaced = {
      stack: event.stack,
      found: event.found,
      missing: event.missing,
    };
  },

  "credential-variables-substituted": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookCredentialVariablesReplaced
  ): void {
    const operation = currentAuthentingOperation(stateCurrent, stateResult);
    operation.auth[event.name].result = event.result;
    operation.auth[event.name].variables = {
      missing: event.missing,
      found: event.found,
      stack: event.stack,
    };
  },

  "credential-retrieved-from-cache": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookCredentialRetrievedFromCache
  ): void {
    const operation = currentAuthentingOperation(stateCurrent, stateResult);
    operation.auth[event.name].result = event.result;
  },

  "http-request-prepared": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpRequestPrepared
  ): void {
    const operation = currentOperation(stateCurrent, stateResult);
    operation.httpRequest = event.request;
    operation.operationId = event.operationId;
  },

  "http-request-prepare-error": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpRequestPrepareError
  ): void {
    const operation = currentOperation(stateCurrent, stateResult);
    operation.httpRequestPrepareError = event.error;
    operation.status = "failure";
    currentPlaybook(stateCurrent, stateResult).status = "failure";
  },

  "http-response-received": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpResponseReceived
  ): void {
    const operation = currentOperation(stateCurrent, stateResult);
    operation.httpResponse = event.response;
    operation.status = "success";
  },

  "http-error-received": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpErrorReceived
  ): void {
    const operation = currentOperation(stateCurrent, stateResult);
    operation.httpError = event.error;
    operation.status = "failure";
    currentPlaybook(stateCurrent, stateResult).status = "failure";
  },

  "variables-assigned": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookVariablesAssigned
  ): void {
    currentOperation(stateCurrent, stateResult).variablesAssigned.push(...event.assignments);
  },

  "response-processing-error": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookResponseProcessingError
  ): void {
    const operation = currentOperation(stateCurrent, stateResult);
    operation.responseProcessingError = event.error;
    operation.status = "failure";
    currentPlaybook(stateCurrent, stateResult).status = "failure";
  },
};

export function handleTryItStep(
  {
    tryCurrent: stateCurrent,
    tryResult: stateResult,
  }: { tryCurrent: Current; tryResult: ExecutionResult },
  step: PlaybookExecutorStep
) {
  PlaybookStepHandlers[step.event](stateCurrent, stateResult, step as any);
}

export function handleMockStep(
  {
    mockCurrent: stateCurrent,
    mockResult: stateResult,
  }: { mockCurrent: Current; mockResult: ExecutionResult },
  step: PlaybookExecutorStep
) {
  PlaybookStepHandlers[step.event](stateCurrent, stateResult, step as any);
}

function last<T>(array: T[]): T {
  return array[array.length - 1];
}

export function findResult(result: ExecutionResult, name: string) {
  return result.filter((e) => e.name === name).pop();
}
