import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { TypedStartListening } from "@reduxjs/toolkit";

import { HostApplication } from "../types";
import {
  sendRequest,
  createSchema,
  sendRequestCurl,
  updateScanConfig,
  saveConfig,
} from "./oasSlice";
import type { RootState, AppDispatch } from "./store";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export default function createListener(host: HostApplication) {
  startAppListening({
    actionCreator: sendRequest,
    effect: async (action, listenerApi) => {
      host.postMessage({ command: "sendRequest", payload: action.payload.request });
    },
  });

  startAppListening({
    actionCreator: createSchema,
    effect: async (action, listenerApi) => {
      host.postMessage({ command: "createSchema", payload: action.payload.response });
    },
  });

  startAppListening({
    actionCreator: sendRequestCurl,
    effect: async (action, listenerApi) => {
      host.postMessage({ command: "sendCurl", payload: action.payload });
    },
  });

  startAppListening({
    actionCreator: updateScanConfig,
    effect: async (action, listenerApi) => {
      host.postMessage({ command: "updateScanConfig", payload: action.payload });
    },
  });

  startAppListening({
    actionCreator: saveConfig,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState();
      host.postMessage({ command: "saveConfig", payload: state.oas.tryitConfig });
    },
  });

  return listenerMiddleware;
}
