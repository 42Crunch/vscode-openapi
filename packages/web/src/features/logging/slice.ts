import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { LogMessage } from "@xliic/common/logging";

export interface EnvState {
  messages: LogMessage[];
}

const initialState: EnvState = {
  messages: [],
};

export const slice = createSlice({
  name: "logging",
  initialState,
  reducers: {
    showLogMessage: (state, action: PayloadAction<LogMessage>) => {
      state.messages.push(action.payload);
    },
    clearLogs: (state) => {
      state.messages = [];
    },
  },
});

export const { showLogMessage, clearLogs } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
