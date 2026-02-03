import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleTryItStep } from "../playbook-execution-handler";
import { Configuration } from "../../../core/playbook-tests";
import { TestIssue } from "../../../core/playbook-tests/types";

type TryResult = Record<string, SuiteResult>;
export type SuiteResult = Record<string, StageResult>;
export type StageResult = Record<
  string,
  { current: Current; result: ExecutionResult; failures: any[] }
>;

export type State = {
  suiteId?: string;
  try: TryResult;
  config: Configuration;
};

const initialState: State = {
  try: {},
  config: {
    basic: [undefined, {}],
    basicBola: [undefined, {}],
    basicSecurityRequirements: [undefined, {}],
    basicScopes: [undefined, {}],
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

    addTryExecutionStep: (
      state,
      {
        payload: { testId, stageId, step },
      }: PayloadAction<{
        testId: string;
        stageId: string;
        step: PlaybookExecutorStep<TestIssue[]>;
      }>
    ) => {
      if (!state.try[state.suiteId!][testId]) {
        state.try[state.suiteId!][testId] = {};
      }

      if (!state.try[state.suiteId!][testId][stageId]) {
        state.try[state.suiteId!][testId][stageId] = {
          current: { auth: [] },
          result: [],
          failures: [],
        };
      }

      handleTryItStep(
        {
          tryCurrent: state.try[state.suiteId!][testId][stageId].current,
          tryResult: state.try[state.suiteId!][testId][stageId].result,
        },
        step as PlaybookExecutorStep
      );

      if (step.event === "playbook-finished" && step.result) {
        console.log("test stage result", testId, stageId, step.result);
        state.try[state.suiteId!][testId][stageId].failures.push(...step.result);
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
  addTryExecutionStep,
  updateTestConfig,
} = slice.actions;

export default slice.reducer;
