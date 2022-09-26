import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Preferences } from "@xliic/common/messages/prefs";

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

export default slice.reducer;
