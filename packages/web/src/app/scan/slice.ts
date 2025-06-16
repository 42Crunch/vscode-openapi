import { createSlice, Dispatch, PayloadAction, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { SeverityLevel, SeverityLevels } from "@xliic/common/audit";
import { GeneralError } from "@xliic/common/error";
import { HttpConfig, HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { TextChunk } from "@xliic/common/index-db";
import { Preferences } from "@xliic/common/prefs";
import {
  FullScanReport,
  OasWithOperationAndConfig,
  ScanConfig,
  SingleOperationScanReport,
} from "@xliic/common/scan";
import {
  RuntimeOperationReport,
  ScanReportJSONSchema,
  TestLogReport,
} from "@xliic/common/scan-report";
import { TryitOperationValues } from "@xliic/common/tryit";
import { BundledSwaggerOrOasSpec, getOperation, HttpMethod, HttpMethods } from "@xliic/openapi";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { ac } from "vitest/dist/chunks/reporters.d.DG9VKi4m";

export type Filter = {
  severity?: SeverityLevel;
  title?: string;
  path?: string;
  method?: HttpMethod;
  operationId?: string;
};

export type TestLogReportWithLocation = TestLogReport & {
  path: string;
  method?: HttpMethod;
  operationId?: string;
  operation?: any;
  type?: string;
};

export interface OasState {
  oas: BundledSwaggerOrOasSpec;
  rawOas: string;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  scanConfig?: ScanConfig;
  scanConfigRaw?: unknown;
  scanReport?: ScanReportJSONSchema;
  response?: HttpResponse;
  error?: GeneralError;
  prefs: Preferences;
  responses: Record<string, HttpResponse>;
  waitings: Record<string, boolean>;
  errors: Record<string, HttpError>;
  waiting: boolean;
  filter: Filter;
  tab: "summary" | "tests" | "logs";
  issues: TestLogReportWithLocation[];
  grouped: Record<string, TestLogReportWithLocation[]>;
  operations: Record<string, RuntimeOperationReport>;
  titles: string[];
  paths: string[];
  operationIds: string[];
  // TODO: move to seprate state
  chunkId: number;
  progress: number;
  chunkText: string;
  totalItems: number;
  pageIndex: number;
  initDbStarted: boolean;
  // initDbStatus: boolean | undefined;
  // initDbError: string;
}

const initialState: OasState = {
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: {},
  },
  rawOas: "",
  scanReport: undefined,
  prefs: {
    scanServer: "",
    tryitServer: "",
    security: {},
    useGlobalBlocks: true,
    rejectUnauthorized: true,
  },
  error: undefined,
  responses: {},
  waitings: {},
  errors: {},
  waiting: true,
  filter: {},
  tab: "summary",
  grouped: {},
  issues: [],
  operations: {},
  titles: [],
  paths: [],
  operationIds: [],
  chunkId: -1,
  progress: 0,
  chunkText: "",
  totalItems: 0,
  pageIndex: 1,
  initDbStarted: false,
  // initDbStatus: undefined,
  // initDbError: "",
};

export const slice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    startScan: (state, action: PayloadAction<undefined>) => {
      state.error = undefined;
      state.scanReport = undefined;
      state.waiting = true;
      state.response = undefined;
      state.responses = {};
    },

    scanOperation: (state, action: PayloadAction<OasWithOperationAndConfig>) => {},

    runScan: (
      state,
      action: PayloadAction<{
        defaultValues: TryitOperationValues;
        scanConfigRaw: unknown;
        env: Record<string, string>;
        rawOas: string;
      }>
    ) => {
      state.defaultValues = action.payload.defaultValues;
      // clear potentially set scan report and the error
      state.scanReport = undefined;
      state.error = undefined;
      state.waiting = true;
      state.response = undefined;
      state.responses = {};
    },

    showScanReport: (state, action: PayloadAction<SingleOperationScanReport>) => {
      const { oas, path, method, report } = action.payload;

      const oasOperation = getOperation(oas, path, method);
      const operationId =
        oasOperation?.operationId === undefined ? `${path}:${method}` : oasOperation.operationId;
      const operation = report.operations?.[operationId];

      if (operation) {
        state.operations[operationId] = operation;
      }

      const issues = flattenIssues(report);
      const filtered = filterIssues(issues, state.filter);
      const { titles, paths, operationIds } = groupIssues(issues);
      const { grouped } = groupIssues(filtered);

      state.issues = issues;
      state.titles = titles;
      state.paths = paths;
      state.operationIds = operationIds;
      state.grouped = grouped;
      state.oas = oas;
      state.scanReport = report;
      state.waiting = false;
    },

    showIssuesTable: (
      state,
      action: PayloadAction<{ totalItems: number; issues: TestLogReportWithLocation[] }>
    ) => {
      state.issues = action.payload.issues;
      state.totalItems = action.payload.totalItems;
    },

    showFullScanReport2: (
      state,
      action: PayloadAction<{ pageIndex: number; issues: TestLogReportWithLocation[]; report: any }>
    ) => {
      //const { oas, report } = action.payload;

      //const issues = action.payload.issues;
      const report = action.payload.report;
      const issues = flattenIssues2(report, action.payload.issues);

      const filtered = filterIssues(issues, state.filter);
      const { titles, paths, operationIds } = groupIssues(issues);
      const { grouped } = groupIssues(filtered);

      //state.oas = oas;
      state.operations = { ...(report.operations.slice(1, 10) || {}) }; // todo: temp limit operations
      state.issues = issues;
      state.titles = titles;
      state.paths = paths;
      state.operationIds = operationIds;
      state.grouped = grouped;
      state.scanReport = report;
      state.waiting = false;
      state.pageIndex = action.payload.pageIndex;
    },

    showFullScanReport: (state, action: PayloadAction<FullScanReport>) => {
      const { oas, report } = action.payload;

      const issues = flattenIssues(report);
      const filtered = filterIssues(issues, state.filter);
      const { titles, paths, operationIds } = groupIssues(issues);
      const { grouped } = groupIssues(filtered);

      state.oas = oas;
      state.operations = { ...(report.operations || {}) };
      state.issues = issues;
      state.titles = titles;
      state.paths = paths;
      state.operationIds = operationIds;
      state.grouped = grouped;
      state.scanReport = report;
      state.waiting = false;
    },

    changeFilter: (state, action: PayloadAction<Filter>) => {
      state.filter = action.payload;
      const filtered = filterIssues(state.issues, state.filter);
      const { grouped } = groupIssues(filtered);
      state.grouped = grouped;
    },

    changeTab: (state, action: PayloadAction<OasState["tab"]>) => {
      state.tab = action.payload;
    },

    showGeneralError: (state, action: PayloadAction<GeneralError>) => {
      state.error = action.payload;
      state.waiting = false;
    },

    showHttpResponse: (
      state,
      { payload: { id, response } }: PayloadAction<{ id: string; response: HttpResponse }>
    ) => {
      state.responses[id] = response;
      state.waitings[id] = false;
      delete state.errors[id];
    },

    showHttpError: (
      state,
      { payload: { id, error } }: PayloadAction<{ id: string; error: HttpError }>
    ) => {
      state.errors[id] = error;
      state.waitings[id] = false;
      delete state.responses[id];
    },

    sendHttpRequest: (
      state,
      { payload: { id } }: PayloadAction<{ id: string; request: HttpRequest; config: HttpConfig }>
    ) => {
      state.waitings[id] = true;
    },

    sendCurlRequest: (state, action: PayloadAction<string>) => {},

    showJsonPointer: (state, action: PayloadAction<string>) => {},

    startInitDb: (state, action: PayloadAction<undefined>) => {
      state.initDbStarted = true;
    },

    sendInitDbComplete: (state, action: PayloadAction<{ status: boolean; message: string }>) => {
      // hook for a listener
    },

    sendParseChunkComplete: (state, action: PayloadAction<{ id: number }>) => {
      // hook for a listener
    },

    closeInitDb: (state, action: PayloadAction<undefined>) => {
      // TODO
    },

    parseChunk: (state, action: PayloadAction<TextChunk>) => {
      state.chunkId = action.payload.id;
      state.chunkText = action.payload.textSegment;
      state.progress = action.payload.progress;
    },

    setTotalItems: (state, action: PayloadAction<{ size: number }>) => {
      state.totalItems = action.payload.size;
    },
  },
});

export const {
  startScan,
  scanOperation,
  runScan,
  showScanReport,
  showFullScanReport,
  showFullScanReport2,
  showIssuesTable,
  showGeneralError,
  showHttpError,
  sendHttpRequest,
  sendCurlRequest,
  showHttpResponse,
  showJsonPointer,
  changeTab,
  changeFilter,
  startInitDb,
  sendInitDbComplete,
  sendParseChunkComplete,
  closeInitDb,
  parseChunk,
  setTotalItems,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

// todo: get rid of any
function flattenIssues2(scanReport: any, issues2: TestLogReportWithLocation[]) {
  const issues: TestLogReportWithLocation[] = [];

  for (const [operationId, operationReport] of Object.entries(scanReport?.operations || {})) {
    for (const kind of [
      "conformanceRequestsResults",
      "authorizationRequestsResults",
      "customRequestsResults",
    ] as const) {
      const results = (operationReport as any)[kind];
      const path = (operationReport as any).path;
      const method = (operationReport as any).method.toLocaleLowerCase() as HttpMethod;
      for (const result of results || []) {
        issues.push({ ...result, path, method, operationId });
      }
    }
  }

  return issues2.concat(issues);
}

function flattenIssues(scanReport: ScanReportJSONSchema) {
  const issues: TestLogReportWithLocation[] = [];

  for (const [operationId, operationReport] of Object.entries(scanReport?.operations || {})) {
    for (const kind of [
      "conformanceRequestsResults",
      "authorizationRequestsResults",
      "customRequestsResults",
    ] as const) {
      const results = operationReport[kind];
      const path = operationReport.path;
      const method = operationReport.method.toLocaleLowerCase() as HttpMethod;
      for (const result of results || []) {
        issues.push({ ...result, path, method, operationId });
      }
    }
  }

  for (const path of Object.keys(scanReport?.methodNotAllowed || {})) {
    for (const method of HttpMethods) {
      const results = scanReport?.methodNotAllowed?.[path]?.[method]?.conformanceRequestsResults;
      for (const result of results || []) {
        issues.push({ ...result, path });
      }
    }
  }

  return issues;
}

function filterIssues(issues: TestLogReportWithLocation[], filter: Filter) {
  const byTitle = (issue: TestLogReportWithLocation) =>
    filter?.title === undefined || issue.test?.key === filter.title;

  const criticality =
    filter.severity !== undefined ? SeverityLevels.indexOf(filter.severity) + 1 : 0;

  const byCriticality = (issue: TestLogReportWithLocation) =>
    filter.severity === undefined ||
    issue.outcome?.criticality === undefined ||
    issue.outcome?.criticality >= criticality;

  const byPath = (issue: TestLogReportWithLocation) =>
    filter?.path === undefined || issue.path === filter.path;

  const byMethod = (issue: TestLogReportWithLocation) =>
    filter?.method === undefined || issue.method === filter.method;

  const byOperationId = (issue: TestLogReportWithLocation) =>
    filter?.operationId === undefined || issue.operationId === filter.operationId;

  return issues.filter((issue) => {
    return (
      byTitle(issue) &&
      byCriticality(issue) &&
      byPath(issue) &&
      byMethod(issue) &&
      byOperationId(issue)
    );
  });
}

function groupIssues(issues: TestLogReportWithLocation[]): {
  grouped: OasState["grouped"];
  titles: OasState["titles"];
  paths: OasState["paths"];
  operationIds: OasState["operationIds"];
} {
  const grouped: Record<string, TestLogReportWithLocation[]> = {};
  const titles: Record<string, string> = {};

  const paths: Set<string> = new Set();
  const operationIds: Set<string> = new Set();

  for (const issue of issues) {
    const key = issue.test?.key;
    if (key !== undefined) {
      if (grouped[key] === undefined) {
        grouped[key] = [];
        titles[key] = issue.test?.description as string;
      }
      grouped[key].push(issue);
    }
    paths.add(issue.path);
    if (issue.operationId) {
      operationIds.add(issue.operationId);
    }
  }

  const keys = Object.keys(grouped);

  for (const key of keys) {
    // improve sorting
    grouped[key].sort((a, b) => {
      if (a.outcome?.status !== b.outcome?.status) {
        if (a.outcome?.status === "error") {
          return -1;
        }
        if (b.outcome?.status === "error") {
          return 1;
        }
        if (a.outcome?.status === "defective") {
          return -1;
        }
        if (b.outcome?.status === "defective") {
          return 1;
        }
      }

      if (a.outcome?.criticality !== b.outcome?.criticality) {
        return a.outcome?.criticality! - b.outcome?.criticality!;
      }

      return 0;
    });
  }

  return {
    grouped,
    titles: Object.keys(titles),
    paths: Array.from(paths),
    operationIds: Array.from(operationIds),
  };
}

export default slice.reducer;
