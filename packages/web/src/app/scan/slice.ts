import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { BundledSwaggerOrOasSpec, getOperation, isOpenapi, isSwagger } from "@xliic/common/openapi";
import { TryitOperationValues } from "@xliic/common/tryit";
import {
  ScanConfig,
  OasWithOperationAndConfig,
  SingleOperationScanReport,
} from "@xliic/common/scan";
import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  HttpError,
  HttpMethods,
  HttpConfig,
} from "@xliic/common/http";
import { GeneralError } from "@xliic/common/error";
import { Preferences } from "@xliic/common/prefs";
import { ScanReportJSONSchema, TestLogReport } from "@xliic/common/scan-report";
import { SeverityLevel, SeverityLevels } from "@xliic/common/audit";
import { generateSecurityValues, getSecurity } from "../../util";
import * as scanUtil from "./util-scan";
import * as scanUtilNew from "./util-scan-new";
import {
  getSecurity as getSwaggerSecurity,
  generateSecurityValues as generateSwaggerSecurityValues,
} from "../../util-swagger";
import {
  ScanReportJSONSchema as ScanReportJSONSchemaNew,
  TestLogReport as TestLogReportNew,
  TestResults,
} from "./scan-report-new";
export type Filter = {
  severity?: SeverityLevel;
  title?: string;
};

export interface OasState {
  oas: BundledSwaggerOrOasSpec;
  rawOas: string;
  path?: string;
  method?: HttpMethod;
  operationId?: string;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  scanConfig?: ScanConfig;
  scanConfigRaw?: unknown;
  isNewScanConfig: boolean;
  scanReport?: ScanReportJSONSchema | ScanReportJSONSchemaNew;
  response?: HttpResponse;
  error?: GeneralError;
  prefs: Preferences;
  responses: Record<string, HttpResponse>;
  waitings: Record<string, boolean>;
  errors: Record<string, HttpError>;
  waiting: boolean;
  filter: Filter;
  tab: "summary" | "tests" | "logs";
  grouped: Record<string, TestLogReport[] | TestLogReportNew[]>;
  titles: string[];
  issues: TestLogReport[] | TestLogReportNew[];
}

const initialState: OasState = {
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: {},
  },
  rawOas: "",
  scanReport: undefined,
  isNewScanConfig: true,
  prefs: {
    scanServer: "",
    tryitServer: "",
    security: {},
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
  titles: [],
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
      const { oas, path, method } = action.payload;
      const operation = getOperation(oas, path, method);

      const operationId =
        operation?.operationId === undefined ? `${path}:${method}` : operation.operationId;

      state.operationId = operationId;
      state.oas = oas;
      state.path = path;
      state.method = method;

      const issues = flattenIssuesNew(
        action.payload.report as unknown as ScanReportJSONSchemaNew,
        state.path!,
        state.operationId!
      );
      const filtered = filterIssuesNew(issues, state.filter);
      const { titles } = groupIssuesNew(issues);
      const { grouped } = groupIssuesNew(filtered);
      state.issues = issues;
      state.titles = titles;
      state.grouped = grouped;

      state.scanReport = action.payload.report;
      state.waiting = false;
    },

    changeFilter: (state, action: PayloadAction<Filter>) => {
      state.filter = action.payload;
      if (state.isNewScanConfig) {
        const filtered = filterIssuesNew(state.issues as TestLogReportNew[], state.filter);
        const { grouped } = groupIssuesNew(filtered);
        state.grouped = grouped;
      } else {
        const filtered = filterIssues(state.issues as TestLogReport[], state.filter);
        const { grouped } = groupIssues(filtered);
        state.grouped = grouped;
      }
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

    showAuditReport: (state, action: PayloadAction<undefined>) => {},
  },
});

export const {
  startScan,
  scanOperation,
  runScan,
  showScanReport,
  showGeneralError,
  showHttpError,
  sendHttpRequest,
  sendCurlRequest,
  showHttpResponse,
  showJsonPointer,
  showAuditReport,
  changeTab,
  changeFilter,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

function filterIssues(issues: TestLogReport[], filter: Filter) {
  const byTitle = (issue: TestLogReport) =>
    filter?.title === undefined || issue.test?.key === filter.title;

  const criticality =
    filter.severity !== undefined ? SeverityLevels.indexOf(filter.severity) + 1 : 0;
  const byCriticality = (issue: TestLogReport) =>
    filter.severity === undefined ||
    issue.outcome?.criticality === undefined ||
    issue.outcome?.criticality >= criticality;

  return issues.filter((issue) => {
    return byTitle(issue) && byCriticality(issue);
  });
}

function flattenIssues(scanReport: ScanReportJSONSchema, path: string, method: string) {
  const issues: TestLogReport[] = [];
  for (const method of HttpMethods) {
    const conformanceIssues = scanReport?.paths?.[path!]?.[method!]?.conformanceRequestIssues;
    if (conformanceIssues !== undefined) {
      issues.push(...conformanceIssues);
    }
  }
  return issues;
}

function groupIssues(issues: TestLogReport[]): {
  grouped: OasState["grouped"];
  titles: OasState["titles"];
} {
  const grouped: Record<string, TestLogReport[]> = {};
  const titles: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.test?.key;
    if (key !== undefined) {
      if (grouped[key] === undefined) {
        grouped[key] = [];
        titles[key] = issue.test?.description as string;
      }
      grouped[key].push(issue);
    }
  }

  const keys = Object.keys(grouped);

  for (const key of keys) {
    // improve sorting
    grouped[key].sort((a, b) => {
      if (a.outcome?.status !== b.outcome?.status) {
        if (a.outcome?.status === "incorrect") {
          return -1;
        }
        if (b.outcome?.status === "incorrect") {
          return 1;
        }
        if (a.outcome?.status === "unexpected") {
          return -1;
        }
        if (b.outcome?.status === "unexpected") {
          return 1;
        }
      }

      if (a.outcome?.criticality !== b.outcome?.criticality) {
        return a.outcome?.criticality! - b.outcome?.criticality!;
      }

      return 0;
    });
  }

  return { grouped, titles: Object.keys(titles) };
}

function flattenIssuesNew(scanReport: ScanReportJSONSchemaNew, path: string, operationId: string) {
  const issues: TestLogReportNew[] = [];
  const conformanceIssues = scanReport?.operations?.[operationId]?.conformanceRequestsResults;
  if (conformanceIssues !== undefined) {
    issues.push(...conformanceIssues);
  }

  const methodNotAllowed = scanReport?.methodNotAllowed;

  for (const method of HttpMethods) {
    const conformanceIssues = methodNotAllowed?.[path]?.[method]?.conformanceRequestsResults;
    if (conformanceIssues !== undefined) {
      issues.push(...conformanceIssues);
    }
  }

  return issues;
}

function filterIssuesNew(issues: TestLogReportNew[], filter: Filter) {
  const byTitle = (issue: TestLogReportNew) =>
    filter?.title === undefined || issue.test?.key === filter.title;

  const criticality =
    filter.severity !== undefined ? SeverityLevels.indexOf(filter.severity) + 1 : 0;
  const byCriticality = (issue: TestLogReportNew) =>
    filter.severity === undefined ||
    issue.outcome?.criticality === undefined ||
    issue.outcome?.criticality >= criticality;

  return issues.filter((issue) => {
    return byTitle(issue) && byCriticality(issue);
  });
}

function groupIssuesNew(issues: TestLogReportNew[]): {
  grouped: OasState["grouped"];
  titles: OasState["titles"];
} {
  const grouped: Record<string, TestLogReportNew[]> = {};
  const titles: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.test?.key;
    if (key !== undefined) {
      if (grouped[key] === undefined) {
        grouped[key] = [];
        titles[key] = issue.test?.description as string;
      }
      grouped[key].push(issue);
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

  return { grouped, titles: Object.keys(titles) };
}

export default slice.reducer;
