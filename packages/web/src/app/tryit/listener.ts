import {
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/tryit";
import { AppDispatch, RootState } from "./store";
import { sendHttpRequest, createSchema, saveConfig } from "./slice";
import { showEnvWindow } from "../../features/env/slice";
import { setTryitServer, setSecretForSecurity } from "../../features/prefs/slice";
import { startNavigationListening } from "../../features/router/listener";
import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    sendHttpRequest: () =>
      startAppListening({
        actionCreator: sendHttpRequest,
        effect: async (action, listenerApi) => {
          host.postMessage({ command: "sendHttpRequest", payload: action.payload.request });
        },
      }),

    createSchema: () =>
      startAppListening({
        actionCreator: createSchema,
        effect: async (action, listenerApi) => {
          host.postMessage({ command: "createSchema", payload: action.payload.response });
        },
      }),

    saveConfig: () =>
      startAppListening({
        actionCreator: saveConfig,
        effect: async (action, listenerApi) => {
          const state = listenerApi.getState();
          host.postMessage({ command: "saveConfig", payload: state.tryit.tryitConfig });
        },
      }),

    savePrefs: () =>
      startAppListening({
        matcher: isAnyOf(setTryitServer, setSecretForSecurity),
        effect: async (action, listenerApi) => {
          const { prefs } = listenerApi.getState();
          host.postMessage({
            command: "savePrefs",
            payload: prefs,
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
