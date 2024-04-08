import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { Change } from "@xliic/scanconf-changes";

export type State = {
  changes: Change[];
  scanconf: string;
  oas: BundledSwaggerOrOasSpec;
};

const initialState: State = {
  changes: [],
  scanconf: "",
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: { "/": { get: { responses: {} } } },
  },
};

export const slice = createSlice({
  name: "scanconfUpdate",
  initialState,
  reducers: {
    showChanges: (
      state,
      action: PayloadAction<{ oas: BundledSwaggerOrOasSpec; scanconf: string; changes: Change[] }>
    ) => {
      state.changes = action.payload.changes;
      state.scanconf = action.payload.scanconf;
      state.oas = action.payload.oas;
    },

    updateScanconf: (state) => {},
    skipScanconfUpdate: (state) => {},
  },
});

export const { updateScanconf, showChanges, skipScanconfUpdate } = slice.actions;

export default slice.reducer;
