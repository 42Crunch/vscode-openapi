import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/tags";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import { saveTags, sendHttpRequest } from "./slice";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
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
    saveTags: () =>
      startAppListening({
        actionCreator: saveTags,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "saveTags",
            payload: action.payload,
          });
        },
      }),
  };

  startListeners(listeners);

  return listenerMiddleware;
}
