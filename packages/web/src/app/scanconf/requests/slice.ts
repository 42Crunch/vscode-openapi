import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { SimpleEnvironment } from "@xliic/common/env";
import { getOperation, makeOperationId } from "@xliic/common/openapi";
import { RequestRef } from "@xliic/common/playbook";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { showScanconfOperation } from "../actions";
import { ExecutionResult } from "../components/scenario/types";
import { Current, PlaybookStepHandlers } from "../playbook-execution-handler";

export type State = {
  ref?: RequestRef;
  current: Current;
  result: ExecutionResult;
  mockCurrent: Current;
  mockResult: ExecutionResult;
  mockMissingVariables: string[];
};

const initialState: State = {
  current: { auth: undefined },
  result: [],
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
      state.result = [];
    },

    executeRequest: (
      state,
      action: PayloadAction<{ inputs: SimpleEnvironment; server: string }>
    ) => {
      state.current = { auth: undefined };
      state.result = [];
    },

    addExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      PlaybookStepHandlers[step.event](state.current, state.result, step as any);
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
      PlaybookStepHandlers[step.event](state.mockCurrent, state.mockResult, step as any);
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
