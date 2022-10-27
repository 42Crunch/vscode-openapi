import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { BundledSwaggerOrOasSpec, getOperation, isOpenapi, isSwagger } from "@xliic/common/openapi";
import { TryitOperationValues } from "@xliic/common/tryit";
import {
  ScanConfig,
  OasWithOperationAndConfig,
  SingleOperationScanReport,
  DocumentAndJsonPointer,
} from "@xliic/common/scan";
import { HttpMethod, HttpRequest, HttpResponse, HttpError } from "@xliic/common/http";
import { GeneralError } from "@xliic/common/error";
import { Preferences } from "@xliic/common/prefs";
import { ScanReportJSONSchema } from "@xliic/common/scan-report";
import { generateSecurityValues, getSecurity } from "../../util";
import { generateParameterValuesForScan, readRawScanConfig } from "./util-scan";
import {
  getSecurity as getSwaggerSecurity,
  generateSecurityValues as generateSwaggerSecurityValues,
} from "../../util-swagger";

export interface OasState {
  oas: BundledSwaggerOrOasSpec;
  rawOas: string;
  document: string;
  path?: string;
  method?: HttpMethod;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  scanConfig?: ScanConfig;
  scanConfigRaw?: unknown;
  scanReport: ScanReportJSONSchema | undefined;
  response?: HttpResponse;
  error: GeneralError | undefined;
  prefs: Preferences;
  responses: Record<string, HttpResponse>;
  waitings: Record<string, boolean>;
  errors: Record<string, HttpError>;
  waiting: boolean;
}

const initialState: OasState = {
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: {},
  },
  rawOas: "",
  document: "",
  scanReport: undefined,
  prefs: {
    scanServer: "",
    tryitServer: "",
    security: {},
  },
  error: undefined,
  responses: {},
  waitings: {},
  errors: {},
  waiting: false,
};

export const slice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    scanOperation: (state, action: PayloadAction<OasWithOperationAndConfig>) => {
      const { oas, rawOas, path, method, config, documentUrl: document } = action.payload;
      const scanConfig = readRawScanConfig(config, path, method);

      if (isOpenapi(oas)) {
        // security
        const security = getSecurity(oas, path, method);
        const securityValues = generateSecurityValues(security);

        // parameters
        const parameterValues = generateParameterValuesForScan(scanConfig);

        state.defaultValues = {
          server: scanConfig.host,
          parameters: parameterValues,
          security: securityValues,
          securityIndex: 0,
          body: { mediaType: "application/json", value: scanConfig.requestBody },
        };
      } else {
        // security
        const security = getSwaggerSecurity(oas, path, method);
        const securityValues = generateSwaggerSecurityValues(security);

        // parameters
        const parameterValues = generateParameterValuesForScan(scanConfig);

        state.defaultValues = {
          server: scanConfig.host,
          parameters: parameterValues,
          security: securityValues,
          securityIndex: 0,
        };
      }
      state.document = document;
      state.oas = oas;
      state.rawOas = rawOas;
      state.path = path;
      state.method = method;

      state.scanConfigRaw = config;
      state.scanConfig = scanConfig;

      state.scanReport = undefined;
      state.error = undefined;
    },

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
      // clear potentially set scan report
      state.scanReport = undefined;
      state.waiting = true;
    },

    showScanReport: (state, action: PayloadAction<SingleOperationScanReport>) => {
      // path and method stays the same, update the report alone
      state.scanReport = action.payload.report;
      state.waiting = false;
    },

    showGeneralError: (state, action: PayloadAction<GeneralError>) => {
      state.error = action.payload;
      state.waiting = false;
    },

    showHttpResponse: (state, action: PayloadAction<HttpResponse>) => {
      const httpResponse = action.payload;
      state.responses[httpResponse.id!] = httpResponse;
      state.waitings[httpResponse.id!] = false;
      delete state.errors[httpResponse.id!];
    },

    showHttpError: (state, action: PayloadAction<HttpError>) => {
      const httpError = action.payload;
      state.errors[httpError.id!] = httpError;
      state.waitings[httpError.id!] = false;
      delete state.responses[httpError.id!];
    },

    sendHttpRequest: (state, action: PayloadAction<HttpRequest>) => {
      state.waitings[action.payload.id!] = true;
    },

    sendCurlRequest: (state, action: PayloadAction<string>) => {},

    showJsonPointer: (state, action: PayloadAction<DocumentAndJsonPointer>) => {},
  },
});

export const {
  scanOperation,
  runScan,
  showScanReport,
  showGeneralError,
  showHttpError,
  sendHttpRequest,
  sendCurlRequest,
  showHttpResponse,
  showJsonPointer,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
