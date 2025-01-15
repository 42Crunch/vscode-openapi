import {
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/scan";
import { AppDispatch, RootState } from "./store";
import { showEnvWindow } from "../../features/env/slice";
import { setSecretForSecurity, setScanServer } from "../../features/prefs/slice";
import { sendHttpRequest, sendCurlRequest, showJsonPointer } from "./slice";

import { startNavigationListening } from "../../features/router/listener";
import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    savePrefs: () =>
      startAppListening({
        matcher: isAnyOf(setScanServer, setSecretForSecurity),
        effect: async (action, listenerApi) => {
          const { prefs } = listenerApi.getState();
          host.postMessage({
            command: "savePrefs",
            payload: prefs,
          });
        },
      }),

    sendHttpRequest: () =>
      startAppListening({
        actionCreator: sendHttpRequest,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "sendHttpRequest",
            payload: action.payload,
          });
        },
      }),

    sendCurlRequest: () =>
      startAppListening({
        actionCreator: sendCurlRequest,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "sendCurlRequest",
            payload: action.payload,
          });
        },
      }),

    showJsonPointer: () =>
      startAppListening({
        actionCreator: showJsonPointer,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "showJsonPointer",
            payload: action.payload,
          });
        },
      }),

    showEnvWindow: () =>
      startAppListening({
        actionCreator: showEnvWindow,
        effect: async (action, listenerApi) => {
          host.postMessage({ command: "showEnvWindow", payload: undefined });
        },
      }),
  };

  startNavigationListening(startAppListening, routes);
  startListeners(listeners);

  return listenerMiddleware;
}
