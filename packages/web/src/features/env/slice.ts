import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { DefaultOrSecretsEnvironment, EnvData, NamedEnvironment } from "@xliic/common/env";

export interface EnvState {
  ready: boolean;
  data: EnvData;
}

const initialState: EnvState = {
  ready: false,
  data: { default: {}, secrets: {} },
};

export const slice = createSlice({
  name: "env",
  initialState,
  reducers: {
    loadEnv: (state, action: PayloadAction<Partial<EnvData>>) => {
      if (action.payload.default) {
        state.data.default = action.payload.default;
      }
      if (action.payload.secrets) {
        state.data.secrets = action.payload.secrets;
      }
      state.ready = true;
    },
    saveEnv: (state, action: PayloadAction<DefaultOrSecretsEnvironment>) => {
      // this is also a hook for a listener
      state.data[action.payload.name] = action.payload.environment;
    },
    showEnvWindow: (state, action: PayloadAction<undefined>) => {
      // hook for a listener
    },
  },
});

export const { loadEnv, saveEnv, showEnvWindow } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
