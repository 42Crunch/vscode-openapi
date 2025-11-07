import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { Vault } from "@xliic/common/vault";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export interface VaultState {
  ready: boolean;
  hasErrors: boolean;
  data: Vault;
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
  },
});

export const { loadVault, saveVault } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
