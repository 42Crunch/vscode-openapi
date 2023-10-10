import { Draft, PayloadAction, createSlice } from "@reduxjs/toolkit";
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
  RequestStarted,
} from "../../../core/playbook/playbook";
import { showScanconfOperation } from "../actions";
import {
  BundledSwaggerOrOasSpec,
  getOperation,
  getServerUrls,
  makeOperationId,
} from "@xliic/common/openapi";

import { StageLocationName } from "@xliic/common/playbook";

type PlaybookEventHandlers = {
  [K in PlaybookExecutorStep["event"]]: (
    stateCurrent: Current,
    stateResult: Result,
    event: Extract<PlaybookExecutorStep, { event: K }>
  ) => void;
};

function currentPlaybookResult(stateCurrent: Current, stateResult: Result): PlaybookResult {
  const current = stateCurrent[stateCurrent.length - 1];
  if (
    current === "operationScenarios" ||
    current === "globalBefore" ||
    current === "globalAfter" ||
    current === "operationBefore" ||
    current === "operationAfter"
  ) {
    return stateResult[current]!;
  } else {
    const previous = stateCurrent[stateCurrent.length - 2];
    const preprevious: StageLocationName = stateCurrent[stateCurrent.length - 3] as any;
    if (previous == "auth") {
      const results = stateResult[preprevious]?.results!;
      const result = results[results.length - 1];
      return result.auth[current];
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
    //state.inAuth = event.name;
  },
  "auth-finished": function (
    stateCurrent: Current,
    stateResult: Result,
    event: AuthFinished
  ): void {
    //state.inAuth = undefined;
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
};

type Current = string[];
type Result = {
  globalBefore: PlaybookResult;
  globalAfter: PlaybookResult;
  operationBefore: PlaybookResult;
  operationAfter: PlaybookResult;
  operationScenarios: PlaybookResult;
};

export type State = {
  operationId?: string;
  scenarioId: number;
  mockCurrent: Current;
  mockResult: Result;
  tryCurrent: Current;
  tryResult: Result;
};

const initialState: State = {
  mockCurrent: [],
  mockResult: {
    operationBefore: { context: {}, results: [] },
    operationAfter: { context: {}, results: [] },
    operationScenarios: { context: {}, results: [] },
    globalAfter: { context: {}, results: [] },
    globalBefore: { context: {}, results: [] },
  },
  tryCurrent: [],
  tryResult: {
    operationBefore: { context: {}, results: [] },
    operationAfter: { context: {}, results: [] },
    operationScenarios: { context: {}, results: [] },
    globalAfter: { context: {}, results: [] },
    globalBefore: { context: {}, results: [] },
  },
  scenarioId: 0,
};

export const slice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    setOperationId: (state, { payload: operationId }: PayloadAction<string>) => {
      state.operationId = operationId;
      state.scenarioId = 0;
    },
    setScenarioId: (state, { payload: scenarioId }: PayloadAction<number>) => {
      state.scenarioId = scenarioId;
    },

    resetMockExecution: (state) => {
      state.mockResult = {
        operationBefore: { context: {}, results: [] },
        operationAfter: { context: {}, results: [] },
        operationScenarios: { context: {}, results: [] },
        globalAfter: { context: {}, results: [] },
        globalBefore: { context: {}, results: [] },
      };
      state.mockCurrent = [];
    },

    addMockExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      PlaybookStepHandlers[step.event](state.mockCurrent, state.mockResult, step as any);
    },

    startTryExecution: (state, { payload: server }: PayloadAction<string>) => {},

    resetTryExecution: (state) => {
      state.tryResult = {
        operationBefore: { context: {}, results: [] },
        operationAfter: { context: {}, results: [] },
        operationScenarios: { context: {}, results: [] },
        globalAfter: { context: {}, results: [] },
        globalBefore: { context: {}, results: [] },
      };
      state.tryCurrent = [];
    },

    addTryExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      PlaybookStepHandlers[step.event](state.tryCurrent, state.tryResult, step as any);
    },
  },

  extraReducers: (builder) => {
    builder.addCase(showScanconfOperation, (state, { payload: { oas, path, method } }) => {
      const operation = getOperation(oas, path, method);
      const operationId =
        operation?.operationId === undefined
          ? makeOperationId(path, method)
          : operation.operationId;
      state.operationId = operationId;
    });
  },
});

export const {
  setOperationId,
  setScenarioId,
  resetMockExecution,
  startTryExecution,
  addMockExecutionStep,
  resetTryExecution,
  addTryExecutionStep,
} = slice.actions;

export default slice.reducer;
