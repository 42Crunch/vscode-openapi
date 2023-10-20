import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { SimpleEnvironment } from "@xliic/common/env";
import { getOperation, makeOperationId } from "@xliic/common/openapi";
import { RequestRef } from "@xliic/common/playbook";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { showScanconfOperation } from "../actions";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleMockStep, handleTryItStep } from "../playbook-execution-handler";

export type State = {
  ref?: RequestRef;
  tryCurrent: Current;
  tryResult: ExecutionResult;
  mockCurrent: Current;
  mockResult: ExecutionResult;
  mockMissingVariables: string[];
};

const initialState: State = {
  tryCurrent: { auth: undefined },
  tryResult: [],
  mockCurrent: { auth: undefined },
  mockResult: [],
  mockMissingVariables: [],
};

export const slice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setRequestId: (state, { payload }: PayloadAction<RequestRef>) => {
      state.ref = payload;
      state.tryResult = [];
    },

    executeRequest: (
      state,
      action: PayloadAction<{ inputs: SimpleEnvironment; server: string }>
    ) => {
      state.tryCurrent = { auth: undefined };
      state.tryResult = [];
    },

    addExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleTryItStep(state, step);
    },

    resetMockRequestExecution: (state) => {
      state.mockCurrent = { auth: undefined };
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
        state.mockMissingVariables.push(...step.missing);
      }
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

export const {
  setRequestId,
  addExecutionStep,
  executeRequest,
  resetMockRequestExecution,
  addMockRequestExecutionStep,
} = slice.actions;

export default slice.reducer;
