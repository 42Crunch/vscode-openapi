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
  PlaybookVariablesAssignmentError,
  RequestStarted,
  PlaybookCredentialVariablesReplaced,
} from "../../core/playbook/playbook";
import { ExecutionResult, OperationResult, PlaybookResult } from "./components/scenario/types";

export type PlaybookEventHandlers = {
  [K in PlaybookExecutorStep["event"]]: (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: Extract<PlaybookExecutorStep, { event: K }>
  ) => void;
};

export type Current = {
  auth: string | undefined;
};

function last<T>(array: T[]): T {
  return array[array.length - 1];
}

export function findResult(result: ExecutionResult, name: string) {
  return result.filter((e) => e.playbook === name).pop();
}

function currentExecutionResult(
  stateCurrent: Current,
  stateResult: ExecutionResult
): ExecutionResult {
  if (stateCurrent.auth === undefined) {
    return stateResult;
  } else {
    const playbook = last(stateResult);
    const operation = last(playbook.results);
    return operation.auth[stateCurrent.auth].execution;
  }
}

function currentPlaybookResult(
  stateCurrent: Current,
  stateResult: ExecutionResult
): PlaybookResult {
  return last(currentExecutionResult(stateCurrent, stateResult));
}

function currentOperationResult(
  stateCurrent: Current,
  stateResult: ExecutionResult
): OperationResult {
  return last(currentPlaybookResult(stateCurrent, stateResult).results);
}

export function handlePlaybookStep(
  stateCurrent: Current,
  stateResult: ExecutionResult,
  step: PlaybookExecutorStep
) {
  PlaybookStepHandlers[step.event](stateCurrent, stateResult, step as any);
}

const PlaybookStepHandlers: PlaybookEventHandlers = {
  "playbook-started": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookStarted
  ): void {
    currentExecutionResult(stateCurrent, stateResult).push({
      playbook: event.name,
      status: "pending",
      results: [],
    });
  },
  "request-started": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: RequestStarted
  ): void {
    currentPlaybookResult(stateCurrent, stateResult).results.push({
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
    currentOperationResult(stateCurrent, stateResult).auth[event.name] = {
      execution: [],
    };
    stateCurrent.auth = event.name;
  },
  "auth-finished": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: AuthFinished
  ): void {
    stateCurrent.auth = undefined;
  },
  "playbook-finished": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookFinished
  ): void {
    last(currentExecutionResult(stateCurrent, stateResult)).status = "success";
    console.log("finished playbook");
  },
  "playbook-aborted": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookAborted
  ): void {
    last(currentExecutionResult(stateCurrent, stateResult)).status = "failure";
  },
  "payload-variables-substituted": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookPayloadVariablesReplaced
  ): void {
    currentOperationResult(stateCurrent, stateResult).variablesReplaced = {
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
    const operation = last(last(stateResult).results);
    operation.auth[event.name].result = event.result;
    operation.auth[event.name].variables = {
      missing: event.missing,
      found: event.found,
      stack: event.stack,
    };
  },
  "http-request-prepared": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpRequestPrepared
  ): void {
    currentOperationResult(stateCurrent, stateResult).httpRequest = event.request;
    currentOperationResult(stateCurrent, stateResult).operationId = event.operationId;
  },
  "http-request-prepare-error": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpRequestPrepareError
  ): void {
    currentOperationResult(stateCurrent, stateResult).httpRequestPrepareError = event.error;
  },
  "http-response-received": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpResponseReceived
  ): void {
    const operation = currentOperationResult(stateCurrent, stateResult);
    operation.httpResponse = event.response;
    operation.status = "success";
  },
  "http-error-received": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookHttpErrorReceived
  ): void {
    const operation = currentOperationResult(stateCurrent, stateResult);
    operation.httpError = event.error;
    operation.status = "failure";
  },
  "variables-assigned": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookVariablesAssigned
  ): void {
    currentOperationResult(stateCurrent, stateResult).variablesAssigned.push(...event.assignments);
  },
  "variables-assignment-error": function (
    stateCurrent: Current,
    stateResult: ExecutionResult,
    event: PlaybookVariablesAssignmentError
  ): void {
    currentOperationResult(stateCurrent, stateResult).variableAssignmentError = event.error;
  },
};
