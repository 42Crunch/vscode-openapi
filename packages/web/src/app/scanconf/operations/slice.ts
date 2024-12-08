import { PayloadAction, createSlice } from "@reduxjs/toolkit";

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
  mockCurrent: { auth: [] },
  mockResult: [],
  tryCurrent: { auth: [] },
  tryResult: [],
  scenarioId: 0,
};

export const slice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    setOperationId: (state, { payload: operationId }: PayloadAction<string | undefined>) => {
      state.operationId = operationId;
      state.scenarioId = 0;
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    setScenarioId: (state, { payload: scenarioId }: PayloadAction<number>) => {
      state.scenarioId = scenarioId;
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    resetMockOperationExecution: (state) => {
      state.mockCurrent = { auth: [] };
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
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    addTryExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleTryItStep(state, step);
    },
  },

  extraReducers: (builder) => {
    builder.addCase(showScanconfOperation, (state, { payload: { oas, path, method } }) => {
      // FIXME, set operationId in the listener
      state.operationId = undefined;
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
