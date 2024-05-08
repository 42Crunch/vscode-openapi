import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Environment, SimpleEnvironment } from "@xliic/common/env";
import { getOperation, makeOperationId } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { showScanconfOperation } from "../actions";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleMockStep, handleTryItStep } from "../playbook-execution-handler";

export type State = {
  ref?: Playbook.RequestRef;
  tryCurrent: Current;
  tryResult: ExecutionResult;
  mockCurrent: Current;
  mockResult: ExecutionResult;
  mockMissingVariables: string[];
};

const initialState: State = {
  tryCurrent: { auth: [] },
  tryResult: [],
  mockCurrent: { auth: [] },
  mockResult: [],
  mockMissingVariables: [],
};

export const slice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setRequestId: (state, { payload }: PayloadAction<Playbook.RequestRef>) => {
      state.ref = payload;
      state.tryResult = [];
    },

    executeRequest: (state, action: PayloadAction<{ inputs: Environment; server: string }>) => {},

    resetExecuteRequest: (state) => {
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    addExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleTryItStep(state, step);
    },

    resetMockRequestExecution: (state) => {
      state.mockCurrent = { auth: [] };
      state.mockResult = [];
      state.mockMissingVariables = [];
    },

    addMockRequestExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep>
    ) => {
      handleMockStep(state, step);
      if (
        step.event === "payload-variables-substituted" ||
        step.event === "credential-variables-substituted"
      ) {
        state.mockMissingVariables.push(...step.missing.map((m) => m.name));
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(showScanconfOperation, (state, { payload: { oas, path, method } }) => {
      const operation = getOperation(oas, path, method);
      const operationId = makeOperationId(operation?.operationId, path, method);
      state.ref = { id: operationId, type: "operation" };
    });
  },
});

export const {
  setRequestId,
  resetExecuteRequest,
  addExecutionStep,
  executeRequest,
  resetMockRequestExecution,
  addMockRequestExecutionStep,
} = slice.actions;

export default slice.reducer;
