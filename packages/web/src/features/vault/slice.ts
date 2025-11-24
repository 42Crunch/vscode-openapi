import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { CredentialIdentifier, SchemeType, SecurityCredential, Vault } from "@xliic/common/vault";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export interface VaultState {
  data: Vault;
  enabled: boolean;
  selectedSchemeId?: string;
}

const initialState: VaultState = {
  data: { schemes: {} },
  enabled: false,
};

export const slice = createSlice({
  name: "vault",
  initialState,
  reducers: {
    loadVault: (state, action: PayloadAction<Vault>) => {
      state.data = action.payload;
      state.enabled = true;
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

    updateCredential: (
      state,
      action: PayloadAction<{
        id: CredentialIdentifier | { scheme: string; credential: undefined };
        name: string;
        value: SecurityCredential;
      }>
    ) => {
      const { id, name, value } = action.payload;
      const scheme = state.data.schemes[id.scheme];
      if (scheme.type !== "alias") {
        if (id.credential === undefined) {
          // new credential
          scheme.credentials[name] = value;
        } else if (id.credential !== name) {
          // rename existing credential
          delete scheme.credentials[id.credential];
          scheme.credentials[name] = value;
        } else {
          // update existing credential
          scheme.credentials[name] = value;
        }
      }
    },

    deleteCredential: (state, action: PayloadAction<CredentialIdentifier>) => {
      const { scheme: schemeName, credential } = action.payload;
      const scheme = state.data.schemes[schemeName];
      if (scheme.type !== "alias") {
        delete scheme.credentials[credential];
      }
    },
  },
});

export const {
  loadVault,
  saveVault,
  selectScheme,
  addScheme,
  deleteScheme,
  updateCredential,
  deleteCredential,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
