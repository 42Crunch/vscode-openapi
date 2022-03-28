import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WritableDraft } from "immer/dist/internal";

import { BundledOpenApiSpec, getOperation } from "@xliic/common/oas30";
import { deref } from "@xliic/common/jsonpointer";
import {
  ScanConfig,
  OasWithOperationAndConfig,
  ScanConfigForOperation,
  ErrorMessage,
} from "@xliic/common/messages/scan";
import { CurlCommand, OasWithOperation, OperationValues } from "@xliic/common/messages/tryit";
import { HttpMethod, HttpRequest, HttpResponse } from "@xliic/common/http";
import { generateBody, generateParameterValues, getParameters } from "../util";

type PageName = "loading" | "scanOperation" | "scanReport" | "tryOperation" | "response" | "error";

export interface OasState {
  page: PageName;
  history: PageName[];
  oas: BundledOpenApiSpec;
  path?: string;
  method?: HttpMethod;
  defaultValues?: OperationValues;
  config?: ScanConfig;
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
      state.config = config;
      goTo(state, "scanOperation");
    },

    tryOperation: (state, action: PayloadAction<OasWithOperation>) => {
      const { oas, path, method } = action.payload;
      state.oas = oas;
      state.path = path;
      state.method = method;
      state.config = undefined;

      const operation = getOperation(oas, path, method);
      const parameters = getParameters(oas, path, method);
      const parameterValues = generateParameterValues(parameters);
      const defaultMediaType = "application/json";

      state.defaultValues = {
        server: oas.servers?.[0].url || "",
        parameters: parameterValues,
        body: {
          mediaType: defaultMediaType,
          value: generateBody(oas, deref(oas, operation?.requestBody), defaultMediaType),
        },
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
      action: PayloadAction<{ defaultValues: OperationValues; request: HttpRequest }>
    ) => {
      state.defaultValues = action.payload.defaultValues;
    },

    sendRequestCurl: (state, action: PayloadAction<CurlCommand>) => {},
    updateScanConfig: (state, action: PayloadAction<ScanConfigForOperation>) => {},
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
} = parametersSlice.actions;

export default parametersSlice.reducer;
