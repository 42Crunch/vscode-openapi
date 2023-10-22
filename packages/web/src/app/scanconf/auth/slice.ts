import { PayloadAction, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { ExecutionResult } from "../components/scenario/types";
import { Current, handleMockStep, handleTryItStep } from "../playbook-execution-handler";
import * as scanconf from "../slice";

export type State = {
  mockCurrent: Current;
  mockResult: ExecutionResult;
  tryCurrent: Current;
  tryResult: ExecutionResult;
};

const initialState: State = {
  mockCurrent: { auth: undefined },
  mockResult: [],
  tryCurrent: { auth: undefined },
  tryResult: [],
};

export const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startTryAuthentication: (state, { payload: server }: PayloadAction<string>) => {},

    resetTryAuthentication: (state) => {
      state.tryCurrent = { auth: undefined };
      state.tryResult = [];
    },

    addTryAuthenticationStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleTryItStep(state, step);
    },

    resetMockAuthRequestsExecution: (state) => {
      state.mockCurrent = { auth: undefined };
      state.mockResult = [];
    },

    addMockAuthRequestsExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep>
    ) => {
      handleMockStep(state, step);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      isAnyOf(
        scanconf.selectCredential,
        scanconf.selectSubcredential,
        scanconf.saveCredential,
        scanconf.addCredential,
        scanconf.removeCredential
      ),
      (state, action) => {
        state.tryCurrent = { auth: undefined };
        state.tryResult = [];
      }
    );
  },
});

export const {
  startTryAuthentication,
  resetTryAuthentication,
  addTryAuthenticationStep,
  resetMockAuthRequestsExecution,
  addMockAuthRequestsExecutionStep,
} = slice.actions;

export default slice.reducer;
