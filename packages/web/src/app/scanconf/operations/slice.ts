import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getOperation, makeOperationId } from "@xliic/common/openapi";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { showScanconfOperation } from "../actions";
import { ExecutionResult } from "../components/scenario/types";

import { Current, handleMockStep, handleTryItStep } from "../playbook-execution-handler";

export type State = {
  operationId?: string;
  scenarioId: number;
  mockCurrent: Current;
  mockResult: ExecutionResult;
  tryCurrent: Current;
  tryResult: ExecutionResult;
};

const initialState: State = {
  // mockCurrent: [],
  // mockResult: {
  //   operationBefore: { context: {}, results: [] },
  //   operationAfter: { context: {}, results: [] },
  //   operationScenarios: { context: {}, results: [] },
  //   globalAfter: { context: {}, results: [] },
  //   globalBefore: { context: {}, results: [] },
  //   credential: { context: {}, results: [] },
  // },
  mockCurrent: { auth: undefined },
  mockResult: [],
  tryCurrent: { auth: undefined },
  tryResult: [],
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

    resetMockOperationExecution: (state) => {
      state.mockCurrent = { auth: undefined };
      state.mockResult = [];
    },

    addMockOperationExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep>
    ) => {
      handleMockStep(state, step);
    },

    startTryExecution: (state, { payload: server }: PayloadAction<string>) => {},

    resetTryExecution: (state) => {
      state.tryCurrent = { auth: undefined };
      state.tryResult = [];
    },

    addTryExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleTryItStep(state, step);
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
  resetMockOperationExecution,
  startTryExecution,
  addMockOperationExecutionStep,
  resetTryExecution,
  addTryExecutionStep,
} = slice.actions;

export default slice.reducer;
