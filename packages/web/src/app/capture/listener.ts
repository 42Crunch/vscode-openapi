import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/capture";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import { browseFiles, downloadFile, openLink, convert, deleteJob } from "./slice";

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
    downloadFile: () =>
      startAppListening({
        actionCreator: downloadFile,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "downloadFile",
            payload: action.payload,
          });
        },
      }),
    deleteJob: () =>
      startAppListening({
        actionCreator: deleteJob,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "deleteJob",
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
