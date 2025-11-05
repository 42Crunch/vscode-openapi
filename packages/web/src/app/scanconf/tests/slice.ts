import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { loadPlaybook } from "../actions";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleTryItStep } from "../playbook-execution-handler";
import { Configuration, configure } from "../../../core/playbook/identity-tests";
import { HookExecutorStep, isHookExecutorStep } from "../../../core/playbook/playbook-tests";

export type State = {
  suiteId?: string;
  try: Record<
    string,
    Record<string, Record<string, { current: Current; result: ExecutionResult }>>
  >;
  config: Configuration;
  failed: string[];
};

const initialState: State = {
  try: {},
  failed: [],
  config: {},
};

export const slice = createSlice({
  name: "tests",
  initialState,
  reducers: {
    setTestSuiteId: (state, { payload: suiteId }: PayloadAction<string | undefined>) => {
      state.suiteId = suiteId;
    },

    startTryExecution: (
      state,
      { payload: { server, suiteId } }: PayloadAction<{ server: string; suiteId: string }>
    ) => {},

    resetTryExecution: (state, { payload: { suiteId } }: PayloadAction<{ suiteId: string }>) => {
      state.try[suiteId] = {};
    },

    addTryExecutionTest: (state, { payload: { testId } }: PayloadAction<{ testId: string }>) => {
      if (!state.try[state.suiteId!][testId]) {
        state.try[state.suiteId!][testId] = {};
      }
    },

    addTryExecutionStep: (
      state,
      {
        payload: { testId, stageId, step },
      }: PayloadAction<{
        testId: string;
        stageId: string;
        step: PlaybookExecutorStep | HookExecutorStep;
      }>
    ) => {
      if (isHookExecutorStep(step)) {
        if (step.event === "test-failed") {
          state.failed.push(step.message);
        }
      } else {
        if (!state.try[state.suiteId!][testId][stageId]) {
          state.try[state.suiteId!][testId][stageId] = { current: { auth: [] }, result: [] };
        }
        handleTryItStep(
          {
            tryCurrent: state.try[state.suiteId!][testId][stageId].current,
            tryResult: state.try[state.suiteId!][testId][stageId].result,
          },
          step
        );
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadPlaybook, (state, { payload: { oas, playbook, vault } }) => {
      state.config = configure(oas, vault);
    });
  },
});

export const {
  setTestSuiteId,
  startTryExecution,
  resetTryExecution,
  addTryExecutionTest,
  addTryExecutionStep,
} = slice.actions;

export default slice.reducer;
