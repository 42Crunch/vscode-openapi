import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { Config } from "@xliic/common/config";

export interface SettingsState {
  ready: boolean;
  data: Config;
}

const initialState: SettingsState = {
  ready: false,
  data: { insecureSslHostnames: [] },
};

export const slice = createSlice({
  name: "settings",
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
    showSettingsWindow: (state, action: PayloadAction<undefined>) => {
      // hook for a listener
    },
  },
});

export const { loadConfig, saveConfig, showSettingsWindow } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
