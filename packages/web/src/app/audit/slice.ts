import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { Audit, Summary, Issue } from "@xliic/common/audit";

export interface Kdb {
  [key: string]: any;
}

export interface ReportState {
  display: "loading" | "full" | "partial" | "no-report";
  summary: Summary;
  all: Issue[];
  selected: Issue[];
  kdb: Kdb;
}

const initialState: ReportState = {
  display: "loading",
  summary: {
    documentUri: "",
    subdocumentUris: [],
    errors: false,
    invalid: false,
    all: 0,
    datavalidation: { max: 0, value: 0 },
    security: { max: 0, value: 0 },
    oasconformance: { max: 0, value: 0 },
  },
  all: [],
  selected: [],
  kdb: {},
};

export const slice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    showFullReport: (state, action: PayloadAction<any>) => {
      state.display = "full";
      state.summary = action.payload.summary;
      state.all = state.selected = flattenIssues(action.payload);
    },
    showPartialReport: (
      state,
      action: PayloadAction<{ report: any; uri: string; ids: string[] }>
    ) => {
      const issues = flattenIssues(action.payload.report);
      const ids = action.payload.ids.map((id) => `${action.payload.uri}-${id}`);
      state.display = "partial";
      state.summary = action.payload.report.summary;
      state.all = issues;
      state.selected = issues.filter((issue) => ids.includes(issue.key));
    },
    goToFullReport: (state) => {
      state.display = "full";
      state.selected = state.all;
    },
    showNoReport: (state) => {
      state.display = "no-report";
      state.summary = initialState.summary;
      state.all = [];
      state.selected = [];
    },
    loadKdb: (state, action: PayloadAction<Kdb>) => {
      state.kdb = action.payload;
    },

    goToLine: (state, action: PayloadAction<any>) => {},
    copyIssueId: (state, action: PayloadAction<string>) => {},
    openLink: (state, action: PayloadAction<string>) => {},
  },
});

function flattenIssues(audit: Audit): Issue[] {
  const issues = Object.entries(audit.issues)
    .map(([uri, issues]) => {
      return issues.map((issue, idx) => ({
        ...issue,
        key: `${uri}-${idx}`,
        filename: audit.files[issue.documentUri].relative,
      }));
    })
    .reduce((acc: any, val) => acc.concat(val), []);
  return issues;
}

export const {
  showFullReport,
  showPartialReport,
  goToFullReport,
  showNoReport,
  loadKdb,
  goToLine,
  copyIssueId,
  openLink,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<typeof slice.actions[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
