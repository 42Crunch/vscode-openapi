import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { EnvData, NamedEnvironment } from "@xliic/common/messages/env";

export interface EnvState {
  data: EnvData;
}

const initialState: EnvState = {
  data: { default: {}, secrets: {} },
};

export const slice = createSlice({
  name: "env",
  initialState,
  reducers: {
    loadEnv: (state, action: PayloadAction<EnvData>) => {
      state.data = action.payload;
    },
    saveEnv: (state, action: PayloadAction<NamedEnvironment>) => {
      state.data[action.payload.name] = action.payload.environment;
    },
  },
});

export const { loadEnv, saveEnv } = slice.actions;

export default slice.reducer;
