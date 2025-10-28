import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Vault } from "@xliic/common/vault";

import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Change } from "@xliic/scanconf-changes";

export type State = {
  changes: Change[];
  scanconf: string;
  oas: BundledSwaggerOrOasSpec;
  vault: Vault;
  updating: boolean;
};

const initialState: State = {
  changes: [],
  scanconf: "",
  vault: { schemes: {} },
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: { "/": { get: { responses: {} } } },
  },
  updating: false,
};

export const slice = createSlice({
  name: "scanconfUpdate",
  initialState,
  reducers: {
    showChanges: (
      state,
      action: PayloadAction<{
        oas: BundledSwaggerOrOasSpec;
        scanconf: string;
        changes: Change[];
        vault: Vault;
      }>
    ) => {
      state.changes = action.payload.changes;
      state.scanconf = action.payload.scanconf;
      state.oas = action.payload.oas;
      state.vault = action.payload.vault;
      state.updating = false;
    },

    updateScanconf: (state) => {
      state.updating = true;
    },

    skipScanconfUpdate: (state) => {},
  },
});

export const { updateScanconf, showChanges, skipScanconfUpdate } = slice.actions;

export default slice.reducer;
