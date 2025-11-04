import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { loadPlaybook, showScanconfOperation } from "../actions";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleMockStep, handleTryItStep } from "../playbook-execution-handler";
import { Configuration, configure } from "../../../core/playbook/identity-tests";
import { HookExecutorStep, isHookExecutorStep } from "../../../core/playbook/playbook-tests";

export type State = {
  suiteId?: string;
  tryCurrent: Current;
  tryResult: ExecutionResult;
  config: Configuration;
  failed: string[];
};

const initialState: State = {
  tryCurrent: { auth: [] },
  tryResult: [],
  failed: [],
  config: {},
};

export const slice = createSlice({
  name: "tests",
  initialState,
  reducers: {
    setTestSuiteId: (state, { payload: suiteId }: PayloadAction<string | undefined>) => {
      state.suiteId = suiteId;
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    startTryExecution: (state, { payload: server }: PayloadAction<string>) => {},

    resetTryExecution: (state) => {
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    addTryExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep | HookExecutorStep>
    ) => {
      if (isHookExecutorStep(step)) {
        if (step.event === "test-failed") {
          state.failed.push(step.message);
        }
      } else {
        handleTryItStep(state, step);
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadPlaybook, (state, { payload: { oas, playbook, vault } }) => {
      state.config = configure(oas, vault);
    });
  },
});

export const { setTestSuiteId, startTryExecution, resetTryExecution, addTryExecutionStep } =
  slice.actions;

export default slice.reducer;
