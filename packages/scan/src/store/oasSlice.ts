import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WritableDraft } from "immer/dist/internal";

import { BundledOpenApiSpec, getOperation } from "@xliic/common/oas30";
import {
  ScanConfig,
  OasWithOperationAndConfig,
  ScanConfigForOperation,
} from "@xliic/common/messages/scan";
import {
  CurlCommand,
  OasWithOperation,
  TryitOperationValues,
  TryitConfig,
  ErrorMessage,
} from "@xliic/common/messages/tryit";
import { HttpMethod, HttpRequest, HttpResponse } from "@xliic/common/http";
import {
  generateParameterValues,
  generateSecurityValues,
  getParameters,
  getSecurity,
} from "../util";
import { createDefaultBody } from "../core/form/body";

type PageName = "loading" | "scanOperation" | "scanReport" | "tryOperation" | "response" | "error";

type ConfigSslIgnoreAdd = {
  type: "configSslIgnoreAdd";
  hostname: string;
};

type ConfigSslIgnoreRemove = {
  type: "configSslIgnoreRemove";
  hostname: string;
};

type ConfigUpdatePayload = ConfigSslIgnoreAdd | ConfigSslIgnoreRemove;

export interface OasState {
  page: PageName;
  history: PageName[];
  oas: BundledOpenApiSpec;
  path?: string;
  method?: HttpMethod;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  tryitConfig: TryitConfig;
  scanConfig?: ScanConfig;
  response?: HttpResponse;
  error?: ErrorMessage;
  scanReport: any;
}

const initialState: OasState = {
  page: "loading",
  history: [],
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: {},
  },
  tryitConfig: {
    insecureSslHostnames: [],
  },
  response: undefined,
  error: undefined,
  scanReport: undefined,
};

export const parametersSlice = createSlice({
  name: "oas",
  initialState,
  reducers: {
    scanOperation: (state, action: PayloadAction<OasWithOperationAndConfig>) => {
      const { oas, path, method, config } = action.payload;
      state.oas = oas;
      state.path = path;
      state.method = method;
      state.scanConfig = config;
      goTo(state, "scanOperation");
    },

    tryOperation: (state, action: PayloadAction<OasWithOperation>) => {
      const { oas, path, method, preferredMediaType, preferredBodyValue, config } = action.payload;
      state.oas = oas;
      state.path = path;
      state.method = method;
      state.scanConfig = undefined;
      // excersise a bit of caution, config is user-editable, let's make sure it has all expected values
      state.tryitConfig.insecureSslHostnames = config?.insecureSslHostnames || [];

      const operation = getOperation(oas, path, method);
      // parameters
      const parameters = getParameters(oas, path, method);
      const parameterValues = generateParameterValues(oas, parameters);
      // security
      const security = getSecurity(oas, path, method);
      const securityValues = generateSecurityValues(security);
      // body
      const body = createDefaultBody(oas, operation, preferredMediaType, preferredBodyValue);

      state.defaultValues = {
        server: oas.servers?.[0]?.url || "",
        parameters: parameterValues,
        security: securityValues,
        securityIndex: 0,
        body,
      };
      goTo(state, "tryOperation");
    },

    showScanReport: (state, action: PayloadAction<any>) => {
      state.scanReport = action.payload;
      goTo(state, "scanReport");
    },

    showResponse: (state, action: PayloadAction<HttpResponse>) => {
      state.response = action.payload;
      goTo(state, "response");
    },

    showError: (state, action: PayloadAction<ErrorMessage>) => {
      state.error = action.payload;
      goTo(state, "error");
    },

    goBack: (state) => {
      if (state.history.length > 0) {
        state.page = state.history.pop()!;
      }
    },

    // for listeners
    sendRequest: (
      state,
      action: PayloadAction<{ defaultValues: TryitOperationValues; request: HttpRequest }>
    ) => {
      state.defaultValues = action.payload.defaultValues;
    },

    createSchema: (state, action: PayloadAction<{ response: any }>) => {},
    sendRequestCurl: (state, action: PayloadAction<CurlCommand>) => {},
    updateScanConfig: (state, action: PayloadAction<ScanConfigForOperation>) => {},
    saveConfig: (state, action: PayloadAction<ConfigUpdatePayload>) => {
      if (action.payload.type === "configSslIgnoreAdd") {
        state.tryitConfig.insecureSslHostnames.push(action.payload.hostname);
      } else if (action.payload.type === "configSslIgnoreRemove") {
        state.tryitConfig.insecureSslHostnames = state.tryitConfig.insecureSslHostnames.filter(
          (hostname) => hostname !== action.payload.hostname
        );
      }
    },
  },
});

function goTo(state: WritableDraft<OasState>, page: PageName) {
  state.history.push(state.page);
  state.page = page;
}

export const {
  scanOperation,
  tryOperation,
  showResponse,
  showError,
  goBack,
  sendRequest,
  sendRequestCurl,
  updateScanConfig,
  showScanReport,
  createSchema,
  saveConfig,
} = parametersSlice.actions;

export default parametersSlice.reducer;
