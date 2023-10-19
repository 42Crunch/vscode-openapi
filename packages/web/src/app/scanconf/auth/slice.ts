import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { ExecutionResult } from "../components/scenario/types";
import { Current, PlaybookStepHandlers } from "../playbook-execution-handler";

export type State = {
  mockCurrent: Current;
  mockResult: ExecutionResult;
};

const initialState: State = {
  mockCurrent: { auth: undefined },
  mockResult: [],
};

export const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetMockAuthRequestsExecution: (state) => {
      state.mockCurrent = { auth: undefined };
      state.mockResult = [];
    },

    addMockAuthRequestsExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep>
    ) => {
      PlaybookStepHandlers[step.event](state.mockCurrent, state.mockResult, step as any);
    },
  },
});

export const { resetMockAuthRequestsExecution, addMockAuthRequestsExecutionStep } = slice.actions;

export default slice.reducer;
