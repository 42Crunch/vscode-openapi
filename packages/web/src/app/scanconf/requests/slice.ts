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
};

const initialState: State = {
  current: { auth: undefined },
  result: [],
};

export const slice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setRequestId: (state, { payload }: PayloadAction<RequestRef>) => {
      state.ref = payload;
      state.result = [];
    },
    executeRequest: (state, action: PayloadAction<{ env: SimpleEnvironment; server: string }>) => {
      state.current = { auth: undefined };
      state.result = [];
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
