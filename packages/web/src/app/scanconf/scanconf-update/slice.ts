import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

export type State = {};

const initialState: State = {};

export const slice = createSlice({
  name: "scanconfUpdate",
  initialState,
  reducers: {
    updateScanconf: (state) => {},
  },
});

export const { updateScanconf } = slice.actions;

export default slice.reducer;
