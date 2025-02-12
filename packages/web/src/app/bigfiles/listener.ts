import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/bigfiles";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import { browseFile, convert } from "./slice";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    browseFile: () =>
      startAppListening({
        actionCreator: browseFile,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "browseFile",
            payload: action.payload,
          });
        },
      }),
    convert: () =>
      startAppListening({
        actionCreator: convert,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "convert",
            payload: action.payload,
          });
        },
      }),
  };

  startListeners(listeners);
  return listenerMiddleware;
}
