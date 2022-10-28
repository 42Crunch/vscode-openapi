import { createListenerMiddleware, isAnyOf, TypedStartListening } from "@reduxjs/toolkit";

import { HostApplication } from "../types";
import { sendRequest, createSchema, saveConfig } from "../features/tryit/slice";
import { runScan, sendScanRequest, sendCurlRequest } from "../features/scan/slice";
import { saveEnv } from "../features/env/slice";
import { setScanServer, setTryitServer, setSecretForSecurity } from "../features/prefs/slice";

import type { RootState, AppDispatch } from "./store";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export default function createListener(host: HostApplication) {
  // tryit
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
    actionCreator: saveConfig,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState();
      host.postMessage({ command: "saveConfig", payload: state.tryit.tryitConfig });
    },
  });

  // scan
  startAppListening({
    actionCreator: runScan,
    effect: async (action, listenerApi) => {
      host.postMessage({
        command: "runScan",
        payload: {
          config: action.payload.scanConfigRaw,
          env: action.payload.env,
          rawOas: action.payload.rawOas,
        },
      });
    },
  });

  startAppListening({
    actionCreator: saveEnv,
    effect: async (action, listenerApi) => {
      host.postMessage({
        command: "saveEnv",
        payload: action.payload,
      });
    },
  });

  startAppListening({
    actionCreator: sendScanRequest,
    effect: async (action, listenerApi) => {
      host.postMessage({
        command: "sendScanRequest",
        payload: action.payload,
      });
    },
  });

  startAppListening({
    actionCreator: sendCurlRequest,
    effect: async (action, listenerApi) => {
      host.postMessage({
        command: "sendCurlRequest",
        payload: action.payload,
      });
    },
  });

  startAppListening({
    matcher: isAnyOf(setScanServer, setTryitServer, setSecretForSecurity),
    effect: async (action, listenerApi) => {
      const { prefs } = listenerApi.getState();
      host.postMessage({
        command: "savePrefs",
        payload: prefs,
      });
    },
  });

  return listenerMiddleware;
}
