import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Summary, Issue, Audit } from "./types";

export interface ReportState {
  display: "loading" | "full" | "partial" | "no-report";
  summary: Summary;
  all: Issue[];
  selected: Issue[];
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
};

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

export const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    showFullReport: (state, action: PayloadAction<any>) => {
      state.display = "full";
      state.all = state.selected = flattenIssues(action.payload);
    },
    showPartialReport: (
      state,
      action: PayloadAction<{ report: any; uri: string; ids: string[] }>
    ) => {
      const issues = flattenIssues(action.payload.report);
      const ids = action.payload.ids.map((id) => `${action.payload.uri}-${id}`);
      state.display = "partial";
      state.all = issues;
      state.selected = issues.filter((issue) => ids.includes(issue.key));
    },
    goToFullReport: (state) => {
      state.display = "full";
      state.selected = state.all;
    },
    showNoReport: (state) => {
      state.display = "no-report";
      state.all = [];
      state.selected = [];
    },
  },
});

// Action creators are generated for each case reducer function
export const { showFullReport, showPartialReport, showNoReport, goToFullReport } =
  reportSlice.actions;

export default reportSlice.reducer;
