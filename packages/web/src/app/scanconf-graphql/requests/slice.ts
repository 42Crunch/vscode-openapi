import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Environment } from "@xliic/common/env";
import { Playbook } from "@xliic/scanconf";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { ExecutionResult } from "../../scanconf/components/scenario/types";
import { showScanconfOperation } from "../actions";

export type State = {
  ref?: Playbook.RequestRef;
  tryCurrent: any;
  tryResult: ExecutionResult;
  mockCurrent: any;
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

    addExecutionStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {},

    resetMockRequestExecution: (state) => {
      state.mockCurrent = { auth: [] };
      state.mockResult = [];
      state.mockMissingVariables = [];
    },

    addMockRequestExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep>
    ) => {
      if (
        step.event === "payload-variables-substituted" ||
        step.event === "credential-variables-substituted"
      ) {
        state.mockMissingVariables.push(...step.missing.map((m) => m.name));
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(showScanconfOperation, (state, { payload: { graphQl, scanconf } }) => {
      let operationId = "";
      const operations = JSON.parse(scanconf)["operations"];
      if (operations) {
        operationId = Object.keys(operations)[0] || "";
      }
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
