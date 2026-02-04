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
  selected: "before" | "after";
};

const initialState: State = {
  mockCurrent: { auth: [] },
  mockResult: [],
  tryCurrent: { auth: [] },
  tryResult: [],
  selected: "before",
};

export const slice = createSlice({
  name: "global",
  initialState,
  reducers: {
    selectGlobal: (state, { payload: name }: PayloadAction<"before" | "after">) => {
      state.selected = name;
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    startTryGlobal: (state, { payload: server }: PayloadAction<string>) => {},

    resetTryGlobal: (state) => {
      state.tryCurrent = { auth: [] };
      state.tryResult = [];
    },

    addTryGlobalStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleTryItStep(state, step);
    },

    resetMockGlobal: (state) => {
      state.mockCurrent = { auth: [] };
      state.mockResult = [];
    },

    addMockGlobalStep: (state, { payload: step }: PayloadAction<PlaybookExecutorStep>) => {
      handleMockStep(state, step);
    },
  },
});

export const {
  selectGlobal,
  startTryGlobal,
  resetTryGlobal,
  addTryGlobalStep,
  resetMockGlobal,
  addMockGlobalStep,
} = slice.actions;

export default slice.reducer;
