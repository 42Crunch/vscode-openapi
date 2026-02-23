import { PayloadAction, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { PlaybookExecutorStep } from "../../../core/playbook/playbook";
import { ExecutionResult } from "../../scanconf/components/scenario/types";
import * as scanconf from "../slice";

export type State = {
  mockCurrent: any;
  mockResult: ExecutionResult;
  tryCurrent: any;
  tryResult: ExecutionResult;
};

const initialState: State = {
  mockCurrent: { auth: [] },
  mockResult: [],
  tryCurrent: { auth: [] },
  tryResult: [],
};

export const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startTryAuthentication: (state, { payload: server }: PayloadAction<string>) => {},

    resetTryAuthentication: (state) => {
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    addTryAuthenticationStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {},

    resetMockAuthRequestsExecution: (state) => {
      state.mockCurrent = { auth: [] };
      state.mockResult = [];
    },

    addMockAuthRequestsExecutionStep: (
      state,
      { payload: step }: PayloadAction<PlaybookExecutorStep>
    ) => {},
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
        state.tryCurrent = { auth: [] };
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
