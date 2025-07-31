import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/capture";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import {
  browseFiles,
  downloadFile,
  openLink,
  convert,
  deleteJob,
  showCaptureWindow,
} from "./slice";
import { Routes } from "../../features/router/RouterContext";
import { startNavigationListening } from "../../features/router/listener";
import { goTo } from "../../features/router/slice";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const onShowCaptureWindow = () =>
    startAppListening({
      actionCreator: showCaptureWindow,
      effect: async (action, listenerApi) => {
        listenerApi.dispatch(goTo(["capture", "capture2"]));
      },
    });

  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    selectFiles: () =>
      startAppListening({
        actionCreator: browseFiles,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "selectFiles",
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

  startNavigationListening(startAppListening, routes);
  startListeners({ ...listeners, onShowCaptureWindow });
  return listenerMiddleware;
}
