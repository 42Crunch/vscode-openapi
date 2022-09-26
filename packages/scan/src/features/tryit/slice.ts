import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BundledOpenApiSpec, getOperation } from "@xliic/common/oas30";
import {
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
} from "../../util";
import { createDefaultBody } from "../../core/form/body";

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
  oas: BundledOpenApiSpec;
  path?: string;
  method?: HttpMethod;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  tryitConfig: TryitConfig;
  response?: HttpResponse;
  error?: ErrorMessage;
}

const initialState: OasState = {
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
};

export const slice = createSlice({
  name: "oas",
  initialState,
  reducers: {
    tryOperation: (state, action: PayloadAction<OasWithOperation>) => {
      const { oas, path, method, preferredMediaType, preferredBodyValue, config } = action.payload;
      state.oas = oas;
      state.path = path;
      state.method = method;
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
    },

    showResponse: (state, action: PayloadAction<HttpResponse>) => {
      state.response = action.payload;
    },

    showError: (state, action: PayloadAction<ErrorMessage>) => {
      state.error = action.payload;
    },

    // for listeners
    sendRequest: (
      state,
      action: PayloadAction<{ defaultValues: TryitOperationValues; request: HttpRequest }>
    ) => {
      state.defaultValues = action.payload.defaultValues;
    },
    createSchema: (state, action: PayloadAction<{ response: any }>) => {},
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

export const { tryOperation, showResponse, showError, sendRequest, createSchema, saveConfig } =
  slice.actions;

export default slice.reducer;
