import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { SchemeType, Vault } from "@xliic/common/vault";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export interface VaultState {
  ready: boolean;
  hasErrors: boolean;
  data: Vault;
  selectedSchemeId?: string;
}

const initialState: VaultState = {
  ready: false,
  hasErrors: false,
  data: { schemes: {} },
};

export const slice = createSlice({
  name: "vault",
  initialState,
  reducers: {
    loadVault: (state, action: PayloadAction<Vault>) => {
      if (!state.ready) {
        // first load
        state.ready = true;
        state.data = action.payload;
      }
    },

    saveVault: (state, action: PayloadAction<Vault>) => {
      // this is also a hook for a listener
      state.data = action.payload;
    },

    selectScheme: (state, action: PayloadAction<string>) => {
      state.selectedSchemeId = action.payload;
    },

    addScheme: (
      state,
      action: PayloadAction<{ name: string; type: SchemeType; scheme: string }>
    ) => {
      const { name, type, scheme } = action.payload;
      if (type === "alias") {
        state.data.schemes[name] = {
          type: "alias",
          scheme: scheme,
        };
      } else {
        state.data.schemes[name] = {
          type: type,
          credentials: {},
        };
      }
      state.selectedSchemeId = name;
    },

    deleteScheme: (state, action: PayloadAction<string>) => {
      delete state.data.schemes[action.payload];
      if (state.selectedSchemeId === action.payload) {
        state.selectedSchemeId = Object.keys(state.data.schemes)[0];
      }
    },
  },
});

export const { loadVault, saveVault, selectScheme, addScheme, deleteScheme } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
