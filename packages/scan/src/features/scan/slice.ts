import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BundledOpenApiSpec } from "@xliic/common/oas30";
import { TryitOperationValues } from "@xliic/common/messages/tryit";
import { ScanConfig, OasWithOperationAndConfig, ErrorMessage } from "@xliic/common/messages/scan";
import { HttpMethod, HttpRequest, HttpResponse } from "@xliic/common/http";
import { Preferences } from "@xliic/common/messages/prefs";
import { generateSecurityValues, getSecurity } from "../../util";
import { generateParameterValuesForScan, readRawScanConfig } from "./util-scan";

export interface OasState {
  oas: BundledOpenApiSpec;
  rawOas: string;
  path?: string;
  method?: HttpMethod;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  scanConfig?: ScanConfig;
  scanConfigRaw?: unknown;
  scanReport: any;
  response?: HttpResponse;
  error?: ErrorMessage;
  prefs: Preferences;
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
  },
};

export const slice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    scanOperation: (state, action: PayloadAction<OasWithOperationAndConfig>) => {
      const { oas, rawOas, path, method, config } = action.payload;
      state.oas = oas;
      state.rawOas = rawOas;
      state.path = path;
      state.method = method;

      state.scanConfigRaw = config;
      state.scanConfig = readRawScanConfig(config, path, method);

      // security
      const security = getSecurity(oas, path, method);
      const securityValues = generateSecurityValues(security);

      // parameters
      const parameterValues = generateParameterValuesForScan(oas, state.scanConfig);

      state.defaultValues = {
        server: state.scanConfig.host,
        parameters: parameterValues,
        security: securityValues,
        securityIndex: 0,
        body: { mediaType: "application/json", value: state.scanConfig.requestBody },
      };

      // clear potentially set scan report
      state.scanReport = undefined;
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
    },

    showScanReport: (state, action: PayloadAction<any>) => {
      state.scanReport = action.payload;
    },

    sendScanRequest: (state, action: PayloadAction<HttpRequest>) => {},

    sendCurlRequest: (state, action: PayloadAction<string>) => {},

    showScanResponse: (state, action: PayloadAction<HttpResponse>) => {
      state.response = action.payload;
    },

    showError: (state, action: PayloadAction<ErrorMessage>) => {
      state.error = action.payload;
    },
  },
});

export const {
  scanOperation,
  runScan,
  showScanReport,
  sendScanRequest,
  showScanResponse,
  showError,
  sendCurlRequest,
} = slice.actions;

export default slice.reducer;
