import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import { OasWithOperation, TryitOperationValues, TryitConfig } from "@xliic/common/tryit";
import { HttpMethod, HttpRequest, HttpResponse, HttpError } from "@xliic/common/http";
import { createDefaultValues } from "../../util";

import { createDefaultValues as createSwaggerDefaultValues } from "../../util-swagger";
import { GeneralError } from "@xliic/common/error";

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
  oas: BundledSwaggerOrOasSpec;
  path?: string;
  method?: HttpMethod;
  example?: {
    mediaType: string;
    name: string;
  };
  defaultValues?: TryitOperationValues;
  tryitConfig: TryitConfig;
  response?: HttpResponse;
  error?: HttpError;
  gerror: GeneralError | undefined;
  waiting: boolean;
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
  waiting: false,
  response: undefined,
  error: undefined,
  gerror: undefined,
};

export const slice = createSlice({
  name: "oas",
  initialState,
  reducers: {
    tryOperation: (state, action: PayloadAction<OasWithOperation>) => {
      const { oas, path, method, preferredMediaType, preferredBodyValue, config } = action.payload;
      try {
        if (isOpenapi(oas)) {
          state.defaultValues = createDefaultValues(
            oas,
            path,
            method,
            preferredMediaType,
            preferredBodyValue
          );
        } else {
          state.defaultValues = createSwaggerDefaultValues(
            oas,
            path,
            method,
            preferredMediaType,
            preferredBodyValue
          );
        }

        // excersise a bit of caution, config is user-editable, let's make sure it has all expected values
        state.tryitConfig.insecureSslHostnames = config?.insecureSslHostnames || [];
        state.response = undefined;
        state.error = undefined;
      } catch (e) {
        // TODO show error messages, 'failed to update/render UI because of:...'
        console.log("exception occured", e);
        return;
      }

      state.oas = oas;
      state.path = path;
      state.method = method;
    },

    showHttpResponse: (state, action: PayloadAction<HttpResponse>) => {
      state.response = action.payload;
      state.error = undefined;
      state.gerror = undefined;
      state.waiting = false;
    },

    showHttpError: (state, action: PayloadAction<HttpError>) => {
      state.error = action.payload;
      state.gerror = undefined;
      state.response = undefined;
      state.waiting = false;
    },

    showGeneralError: (state, action: PayloadAction<GeneralError>) => {
      state.gerror = action.payload;
      state.error = undefined;
      state.response = undefined;
      state.waiting = false;
    },

    // for listeners
    sendHttpRequest: (
      state,
      action: PayloadAction<{ defaultValues: TryitOperationValues; request: HttpRequest }>
    ) => {
      state.defaultValues = action.payload.defaultValues;
      state.waiting = true;
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

export const {
  tryOperation,
  showHttpResponse,
  showHttpError,
  sendHttpRequest,
  createSchema,
  saveConfig,
  showGeneralError,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
