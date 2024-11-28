import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/capture";
//import { onSendHttpRequest } from "../../features/http-client/listener";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import {
  browseFiles,
  downloadResult,
  executionStart,
  executionStatus,
  openLink,
  prepare,
  prepareUploadFile,
} from "./slice";

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
    prepareUploadFile: () =>
      startAppListening({
        actionCreator: prepareUploadFile,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "prepareUploadFile",
            payload: action.payload,
          });
        },
      }),
    executionStart: () =>
      startAppListening({
        actionCreator: executionStart,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "executionStart",
            payload: action.payload,
          });
        },
      }),
    executionStatus: () =>
      startAppListening({
        actionCreator: executionStatus,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "executionStatus",
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
