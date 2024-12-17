import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/capture";
//import { onSendHttpRequest } from "../../features/http-client/listener";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import { browseFiles, downloadResult, openLink, prepare } from "./slice";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    browseFiles: () =>
      startAppListening({
        actionCreator: browseFiles,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "browseFiles",
            payload: action.payload,
          });
        },
      }),
    prepare: () =>
      startAppListening({
        actionCreator: prepare,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "prepare",
            payload: action.payload,
          });
        },
      }),
    downloadResult: () =>
      startAppListening({
        actionCreator: downloadResult,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "downloadResult",
            payload: action.payload,
          });
        },
      }),
    openLink: () =>
      startAppListening({
        actionCreator: openLink,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "openLink",
            payload: action.payload,
          });
        },
      }),
  };

  startListeners(listeners);
  return listenerMiddleware;
}
