import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/config";
import { AppDispatch, RootState } from "./store";
import {
  saveConfig,
  testPlatformConnection,
  testOverlordConnection,
} from "../../features/config/slice";
import { startListeners } from "../webapp";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    saveConfig: () =>
      startAppListening({
        actionCreator: saveConfig,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "saveConfig",
            payload: action.payload,
          });
        },
      }),

    testPlatformConnection: () =>
      startAppListening({
        actionCreator: testPlatformConnection,
        effect: async (action, listenerApi) => {
          const state = listenerApi.getState();
          host.postMessage({
            command: "saveConfig",
            payload: state.config.data,
          });
          host.postMessage({
            command: "testPlatformConnection",
            payload: undefined,
          });
        },
      }),

    testOverlordConnection: () =>
      startAppListening({
        actionCreator: testOverlordConnection,
        effect: async (action, listenerApi) => {
          const state = listenerApi.getState();
          host.postMessage({
            command: "saveConfig",
            payload: state.config.data,
          });
          host.postMessage({
            command: "testOverlordConnection",
            payload: undefined,
          });
        },
      }),
  };

  startListeners(listeners);

  return listenerMiddleware;
}
