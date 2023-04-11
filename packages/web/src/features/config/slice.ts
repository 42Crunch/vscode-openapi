import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { Config, PlatformConnectionTestResult } from "@xliic/common/config";

export interface ConfigState {
  ready: boolean;
  data: Config;
  platformConnectionTestResult?: PlatformConnectionTestResult;
}

const initialState: ConfigState = {
  ready: false,
  data: {
    insecureSslHostnames: [],
    platformUrl: "https://platform.42crunch.com",
    platformApiToken: "",
  },
  platformConnectionTestResult: undefined,
};

export const slice = createSlice({
  name: "config",
  initialState,
  reducers: {
    loadConfig: (state, action: PayloadAction<Config>) => {
      state.data = action.payload;
      state.ready = true;
    },

    saveConfig: (state, action: PayloadAction<Config>) => {
      // this is also a hook for a listener
      state.data = action.payload;
    },

    showPlatformConnectionTest: (state, action: PayloadAction<PlatformConnectionTestResult>) => {
      state.platformConnectionTestResult = action.payload;
    },

    showConfigWindow: (state, action: PayloadAction<undefined>) => {
      // hook for a listener
    },

    testPlatformConnection: (state, action: PayloadAction<undefined>) => {
      // hook for a listener
    },
  },
});

export const {
  loadConfig,
  saveConfig,
  showConfigWindow,
  testPlatformConnection,
  showPlatformConnectionTest,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
