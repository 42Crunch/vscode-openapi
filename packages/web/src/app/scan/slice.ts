import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { BundledSwaggerOrOasSpec, getOperation, HttpMethod, HttpMethods } from "@xliic/openapi";
import { TryitOperationValues } from "@xliic/common/tryit";
import { SingleOperationScanReport, FullScanReport } from "@xliic/common/scan";
import { GeneralError } from "@xliic/common/error";
import { Preferences } from "@xliic/common/prefs";
import { ScanReportJSONSchema, TestLogReport } from "@xliic/common/scan-report";
import { HappyPathEntry, Page, TestEntry } from "./db/reportdb";

export type Filter = {
  criticality?: number;
  testKey?: number;
  path?: number;
  method?: number;
  operationId?: number;
};

export type TestLogReportWithLocation = TestLogReport & {
  path: string;
  method?: HttpMethod;
  operationId?: string;
};

export interface State {
  scanReport?: {
    scanVersion: string;
    summary: ScanReportJSONSchema["summary"];
    stats: {
      issues: number;
      lowAndAbove: number;
      criticalAndHigh: number;
    };
    paths: { value: number; label: string }[];
    operationIds: { value: number; label: string }[];
    testKeys: { value: number; label: string }[];
  };
  error?: GeneralError;
  waiting: boolean;
  filter: Filter;
  tab: "summary" | "tests" | "logs";
  happyPathPage: Page<HappyPathEntry>;
  testsPage: Page<TestEntry>;
}

const initialState: State = {
  scanReport: undefined,
  error: undefined,
  waiting: true,
  filter: {},
  tab: "summary",
  happyPathPage: {
    items: [],
    pages: 0,
    total: 0,
    current: 0,
  },
  testsPage: {
    items: [],
    pages: 0,
    total: 0,
    current: 0,
  },
};

export const slice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    showScanReport: (state, action: PayloadAction<SingleOperationScanReport>) => {},

    showFullScanReport: (state, action: PayloadAction<FullScanReport>) => {},

    changeFilter: (state, action: PayloadAction<Filter>) => {
      state.filter = action.payload;
    },

    changeTab: (state, action: PayloadAction<State["tab"]>) => {
      state.tab = action.payload;
    },

    showGeneralError: (state, action: PayloadAction<GeneralError>) => {
      state.error = action.payload;
      state.waiting = false;
    },

    showJsonPointer: (state, action: PayloadAction<string>) => {},
    sendCurlRequest: (state, action: PayloadAction<string>) => {},
    parseChunk: (state, action: PayloadAction<string | null>) => {},
    parseChunkCompleted: (state) => {},
    started: (state) => {},
    reportLoaded: (state, action: PayloadAction<State["scanReport"]>) => {
      state.scanReport = action.payload;
      state.waiting = false;
    },
    loadHappyPathPage: (state, action: PayloadAction<number>) => {},
    happyPathPageLoaded: (state, action: PayloadAction<Page<HappyPathEntry>>) => {
      state.happyPathPage = action.payload;
    },

    loadTestsPage: (state, action: PayloadAction<number>) => {},
    testsPageLoaded: (state, action: PayloadAction<Page<TestEntry>>) => {
      state.testsPage = action.payload;
    },
  },
});

export const {
  showScanReport,
  showFullScanReport,
  showGeneralError,
  showJsonPointer,
  sendCurlRequest,
  changeTab,
  changeFilter,
  parseChunk,
  parseChunkCompleted,
  started,
  loadHappyPathPage,
  happyPathPageLoaded,
  reportLoaded,
  loadTestsPage,
  testsPageLoaded,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
