import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { SimpleEnvironment } from "@xliic/common/env";
import { getOperation, makeOperationId } from "@xliic/common/openapi";
import { RequestRef } from "@xliic/common/playbook";
import { OperationResult, PlaybookResult } from "../components/scenario/types";
import {
  AuthFinished,
  AuthStarted,
  PlaybookAborted,
  PlaybookExecutorStep,
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
} from "../../../core/playbook/playbook";
import { showScanconfOperation } from "../actions";
import { StageLocationName } from "@xliic/common/playbook";

type PlaybookEventHandlers = {
  [K in PlaybookExecutorStep["event"]]: (
    stateCurrent: Current,
    stateResult: Result,
    event: Extract<PlaybookExecutorStep, { event: K }>
  ) => void;
};

function currentPlaybookResult(stateCurrent: Current, stateResult: Result): PlaybookResult {
  const name = stateCurrent[stateCurrent.length - 1];
  if (
    name === "operationScenarios" ||
    name === "globalBefore" ||
    name === "globalAfter" ||
    name === "operationBefore" ||
    name === "operationAfter"
  ) {
    return stateResult[name]!;
  } else {
    // must be in auth, "auth" is known playbook name
    if (name == "auth") {
      const credential = stateCurrent[stateCurrent.length - 2];
      const previousName: StageLocationName = stateCurrent[stateCurrent.length - 3] as any;
      const results = stateResult[previousName]?.results!;
      const result = results[results.length - 1];
      if (result.auth[credential] === undefined) {
        result.auth[credential] = { context: {}, results: [] };
      }
      return result.auth[credential];
    }
  }
  return null as any;
}

function currentOperationResult(stateCurrent: Current, stateResult: Result): OperationResult {
  const results = currentPlaybookResult(stateCurrent, stateResult);
  return results.results[results.results.length - 1];
}

const PlaybookStepHandlers: PlaybookEventHandlers = {
  "playbook-started": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookStarted
  ): void {
    console.log("playbook started", event.name);
    stateCurrent.push(event.name);
    console.log("set current to ", event.name);
    // FIXME fix when running authentication scenario
    // smthn like currentResult(state).auth[state.inAuth] = { context: {}, results: [] };
  },
  "request-started": function (
    stateCurrent: Current,
    stateResult: Result,
    event: RequestStarted
  ): void {
    currentPlaybookResult(stateCurrent, stateResult).results.push({
      ref: event.ref,
      auth: {},
      variablesAssigned: [],
    });
  },
  "auth-started": function (stateCurrent: Current, stateResult: Result, event: AuthStarted): void {
    stateCurrent.push(event.name);
  },
  "auth-finished": function (
    stateCurrent: Current,
    stateResult: Result,
    event: AuthFinished
  ): void {
    stateCurrent.pop();
  },
  "playbook-finished": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookFinished
  ): void {
    stateCurrent.pop();
    console.log("finished playbook");
  },
  "playbook-aborted": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookAborted
  ): void {
    stateCurrent.pop();
  },
  "payload-variables-substituted": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookPayloadVariablesReplaced
  ): void {
    currentOperationResult(stateCurrent, stateResult).variablesReplaced = {
      stack: event.stack,
      found: event.found,
      missing: event.missing,
    };
  },
  "http-request-prepared": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookHttpRequestPrepared
  ): void {
    currentOperationResult(stateCurrent, stateResult).httpRequest = event.request;
    currentOperationResult(stateCurrent, stateResult).operationId = event.operationId;
  },
  "http-request-prepare-error": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookHttpRequestPrepareError
  ): void {
    currentOperationResult(stateCurrent, stateResult).httpRequestPrepareError = event.error;
  },
  "http-response-received": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookHttpResponseReceived
  ): void {
    currentOperationResult(stateCurrent, stateResult).httpResponse = event.response;
  },
  "http-error-received": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookHttpErrorReceived
  ): void {
    currentOperationResult(stateCurrent, stateResult).httpError = event.error;
  },
  "variables-assigned": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookVariablesAssigned
  ): void {
    currentOperationResult(stateCurrent, stateResult).variablesAssigned.push(...event.assignments);
  },
  "variables-assignment-error": function (
    stateCurrent: Current,
    stateResult: Result,
    event: PlaybookVariablesAssignmentError
  ): void {
    currentOperationResult(stateCurrent, stateResult).variableAssignmentError = event.error;
  },
};

export type State = {
  ref?: RequestRef;
  current: Current;
  result: Result;
};

type Current = string[];

type Result = {
  globalBefore: PlaybookResult;
  globalAfter: PlaybookResult;
  operationBefore: PlaybookResult;
  operationAfter: PlaybookResult;
  operationScenarios: PlaybookResult;
  credential: PlaybookResult;
};

const initialState: State = {
  current: [],
  result: {
    operationBefore: { context: {}, results: [] },
    operationAfter: { context: {}, results: [] },
    operationScenarios: { context: {}, results: [] },
    globalAfter: { context: {}, results: [] },
    globalBefore: { context: {}, results: [] },
    credential: { context: {}, results: [] },
  },
};

export const slice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setRequestId: (state, { payload }: PayloadAction<RequestRef>) => {
      state.ref = payload;
      state.result = {
        operationBefore: { context: {}, results: [] },
        operationAfter: { context: {}, results: [] },
        operationScenarios: { context: {}, results: [] },
        globalAfter: { context: {}, results: [] },
        globalBefore: { context: {}, results: [] },
        credential: { context: {}, results: [] },
      };
    },
    executeRequest: (state, action: PayloadAction<{ env: SimpleEnvironment; server: string }>) => {
      state.current = [];
      state.result = {
        operationBefore: { context: {}, results: [] },
        operationAfter: { context: {}, results: [] },
        operationScenarios: { context: {}, results: [] },
        globalAfter: { context: {}, results: [] },
        globalBefore: { context: {}, results: [] },
        credential: { context: {}, results: [] },
      };
    },
    addExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      PlaybookStepHandlers[step.event](state.current, state.result, step as any);
    },
  },

  extraReducers: (builder) => {
    builder.addCase(showScanconfOperation, (state, { payload: { oas, path, method } }) => {
      const operation = getOperation(oas, path, method);
      const operationId =
        operation?.operationId === undefined
          ? makeOperationId(path, method)
          : operation.operationId;
      state.ref = { id: operationId, type: "operation" };
    });
  },
});

export const { setRequestId, addExecutionStep, executeRequest } = slice.actions;

export default slice.reducer;
