import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleTryItStep } from "../playbook-execution-handler";
import { Configuration } from "../../../core/playbook/identity-tests";
import { TestStep, isTestStep } from "../../../core/playbook/playbook-tests";

type TryResult = Record<string, SuiteResult>;
export type SuiteResult = Record<string, StageResult>;
export type StageResult = Record<
  string,
  { current: Current; result: ExecutionResult; failed?: string }
>;

export type State = {
  suiteId?: string;
  try: TryResult;
  config: Configuration;
};

const initialState: State = {
  try: {},
  config: {
    basic: {
      ready: false,
      failures: {},
      tests: {},
    },
  },
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
        step: PlaybookExecutorStep | TestStep;
      }>
    ) => {
      if (!state.try[state.suiteId!][testId][stageId]) {
        state.try[state.suiteId!][testId][stageId] = { current: { auth: [] }, result: [] };
      }

      if (isTestStep(step)) {
        if (step.event === "test-failed") {
          state.try[state.suiteId!][testId][stageId].failed = step.message;
        }
      } else {
        handleTryItStep(
          {
            tryCurrent: state.try[state.suiteId!][testId][stageId].current,
            tryResult: state.try[state.suiteId!][testId][stageId].result,
          },
          step
        );
      }
    },

    updateTestConfig: (state, { payload: config }: PayloadAction<Configuration>) => {
      state.config = config;
    },
  },
});

export const {
  setTestSuiteId,
  startTryExecution,
  resetTryExecution,
  addTryExecutionTest,
  addTryExecutionStep,
  updateTestConfig,
} = slice.actions;

export default slice.reducer;
