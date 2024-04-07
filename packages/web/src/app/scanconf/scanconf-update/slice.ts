import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { Change } from "@xliic/scanconf-changes";

export type State = {
  changes: Change[];
  scanconf: string;
};

const initialState: State = {
  changes: [],
  scanconf: "",
};

export const slice = createSlice({
  name: "scanconfUpdate",
  initialState,
  reducers: {
    showChanges: (state, action: PayloadAction<{ scanconf: string; changes: Change[] }>) => {
      state.changes = action.payload.changes;
      state.scanconf = action.payload.scanconf;
    },

    updateScanconf: (state) => {},
  },
});

export const { updateScanconf, showChanges } = slice.actions;

export default slice.reducer;
