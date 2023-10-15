import { Draft, PayloadAction, createSlice } from "@reduxjs/toolkit";
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

type PlaybookEventHandlers = {
  [K in PlaybookExecutorStep["event"]]: (
    state: Draft<State>,
    event: Extract<PlaybookExecutorStep, { event: K }>
  ) => void;
};

function currentPlaybookResult(state: Draft<State>): PlaybookResult {
  const current = state.current[state.current.length - 1];
  if (current === "scenario" || current === "before" || current === "after") {
    return state.result[current]!;
  } else {
    const previous = state.current[state.current.length - 2];
    const preprevious: "scenario" | "before" | "after" = state.current[
      state.current.length - 3
    ] as any;
    if (previous == "auth") {
      const results = state.result[preprevious]?.results!;
      const result = results[results.length - 1];
      return result.auth[current];
    }
  }
  return null as any;
}

function currentOperationResult(state: Draft<State>): OperationResult {
  const results = currentPlaybookResult(state);
  return results.results[results.results.length - 1];
}

const PlaybookStepHandlers: PlaybookEventHandlers = {
  "playbook-started": function (state: Draft<State>, event: PlaybookStarted): void {
    console.log("playbook started", event.name);
    state.current.push(event.name);
    console.log("set current to ", event.name);
    // FIXME fix when running authentication scenario
    // smthn like currentResult(state).auth[state.inAuth] = { context: {}, results: [] };
  },
  "request-started": function (state: Draft<State>, event: RequestStarted): void {
    currentPlaybookResult(state).results.push({ auth: {}, variablesAssigned: [] });
  },
  "auth-started": function (state: Draft<State>, event: AuthStarted): void {
    //state.inAuth = event.name;
  },
  "auth-finished": function (state: Draft<State>, event: AuthFinished): void {
    //state.inAuth = undefined;
  },
  "playbook-finished": function (state: Draft<State>, event: PlaybookFinished): void {
    state.current.pop();
    console.log("finished playbook");
  },
  "playbook-aborted": function (state: Draft<State>, event: PlaybookAborted): void {
    state.current.pop();
  },
  "payload-variables-substituted": function (
    state: Draft<State>,
    event: PlaybookPayloadVariablesReplaced
  ): void {
    currentOperationResult(state).variablesReplaced = {
      stack: event.stack,
      found: event.found,
      missing: event.missing,
    };
  },
  "http-request-prepared": function (
    state: Draft<State>,
    event: PlaybookHttpRequestPrepared
  ): void {
    currentOperationResult(state).httpRequest = event.request;
    currentOperationResult(state).operationId = event.operationId;
  },
  "http-request-prepare-error": function (
    state: Draft<State>,
    event: PlaybookHttpRequestPrepareError
  ): void {
    currentOperationResult(state).httpRequestPrepareError = event.error;
  },
  "http-response-received": function (
    state: Draft<State>,
    event: PlaybookHttpResponseReceived
  ): void {
    currentOperationResult(state).httpResponse = event.response;
  },
  "http-error-received": function (state: Draft<State>, event: PlaybookHttpErrorReceived): void {
    currentOperationResult(state).httpError = event.error;
  },
  "variables-assigned": function (state: Draft<State>, event: PlaybookVariablesAssigned): void {
    currentOperationResult(state).variablesAssigned.push(...event.assignments);
  },
  "variables-assignment-error": function (
    state: Draft<State>,
    event: PlaybookVariablesAssignmentError
  ): void {
    currentOperationResult(state).variableAssignmentError = event.error;
  },
};

export type State = {
  ref?: RequestRef;
  current: string[];
  result: {
    before?: PlaybookResult;
    scenario?: PlaybookResult;
    after?: PlaybookResult;
  };
};

const initialState: State = {
  current: [],
  result: {},
};

export const slice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setRequestId: (state, { payload }: PayloadAction<RequestRef>) => {
      state.ref = payload;
      state.result = {
        before: { context: {}, results: [] },
        scenario: { context: {}, results: [] },
        after: { context: {}, results: [] },
      };
    },
    executeRequest: (state, action: PayloadAction<{ env: SimpleEnvironment; server: string }>) => {
      state.current = [];
      state.result = {
        before: { context: {}, results: [] },
        scenario: { context: {}, results: [] },
        after: { context: {}, results: [] },
      };
    },
    addExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      PlaybookStepHandlers[step.event](state, step as any);
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
