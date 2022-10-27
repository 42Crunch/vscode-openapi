import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { Preferences } from "@xliic/common/prefs";

const initialState: Preferences = {
  security: {},
  scanServer: "",
  tryitServer: "",
};

export const slice = createSlice({
  name: "prefs",
  initialState,
  reducers: {
    loadPrefs: (state, action: PayloadAction<Preferences>) => {
      state.security = action.payload.security;
      state.scanServer = action.payload.scanServer;
      state.tryitServer = action.payload.tryitServer;
    },
    setScanServer: (state, action: PayloadAction<string>) => {
      state.scanServer = action.payload;
    },
    setTryitServer: (state, action: PayloadAction<string>) => {
      state.tryitServer = action.payload;
    },
    setSecretForSecurity: (state, action: PayloadAction<{ scheme: string; secret: string }>) => {
      state.security[action.payload.scheme] = action.payload.secret;
    },
  },
});

export const { loadPrefs, setScanServer, setTryitServer, setSecretForSecurity } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
