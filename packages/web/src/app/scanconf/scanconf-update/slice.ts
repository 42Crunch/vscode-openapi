import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { Change } from "@xliic/scanconf-changes";

export type State = {
  changes: Change[];
};

const initialState: State = {
  changes: [],
};

export const slice = createSlice({
  name: "scanconfUpdate",
  initialState,
  reducers: {
    showChanges: (state, action: PayloadAction<Change[]>) => {
      state.changes = action.payload;
    },

    updateScanconf: (state) => {},
  },
});

export const { updateScanconf, showChanges } = slice.actions;

export default slice.reducer;
