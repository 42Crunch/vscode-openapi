import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WritableDraft } from "immer/dist/internal";
import { tryOperation, showResponse, showError } from "../tryit/slice";
import { scanOperation, showScanReport, showScanResponse as showScanResponse } from "../scan/slice";

export type PageName =
  | "loading"
  | "scanOperation"
  | "scanReport"
  | "scanResponse"
  | "tryOperation"
  | "response"
  | "scanResponse"
  | "error"
  | "env";

export interface RouteState {
  page: PageName;
  history: PageName[];
}

const initialState: RouteState = {
  page: "loading",
  history: [],
};

export const slice = createSlice({
  name: "route",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(scanOperation, (state) => {
      _goTo(state, "scanOperation");
    });

    builder.addCase(tryOperation, (state) => {
      _goTo(state, "tryOperation");
    });

    builder.addCase(showScanReport, (state) => {
      _goTo(state, "scanReport");
    });

    builder.addCase(showScanResponse, (state) => {
      _goTo(state, "scanResponse");
    });

    builder.addCase(showResponse, (state) => {
      _goTo(state, "response");
    });

    builder.addCase(showError, (state) => {
      _goTo(state, "error");
    });
  },
  reducers: {
    goTo: (state, action: PayloadAction<PageName>) => {
      _goTo(state, action.payload);
    },

    goBack: (state) => {
      if (state.history.length > 0) {
        state.page = state.history.pop()!;
      }
    },
  },
});

function _goTo(state: WritableDraft<RouteState>, page: PageName) {
  state.history.push(state.page);
  state.page = page;
}

export const { goBack, goTo } = slice.actions;

export default slice.reducer;
