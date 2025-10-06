import {
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/capture";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import {
  selectFiles,
  downloadFile,
  openLink,
  convert,
  deleteJob,
  showCaptureWindow,
  deleteFile,
  saveCaptureSettings,
} from "./slice";
import { Routes } from "../../features/router/RouterContext";
import { startNavigationListening } from "../../features/router/listener";
import { goTo } from "../../features/router/slice";
import { onSendHttpRequest } from "../../features/http-client/listener";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const onShowCaptureWindow = () =>
    startAppListening({
      actionCreator: showCaptureWindow,
      effect: async (action, listenerApi) => {
        listenerApi.dispatch(goTo(["main", "capture"]));
      },
    });

  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    selectFiles: () =>
      startAppListening({
        actionCreator: selectFiles,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "selectFiles",
            payload: action.payload,
          });
        },
      }),
    saveCaptureSettings: () =>
      startAppListening({
        matcher: isAnyOf(saveCaptureSettings, deleteFile),
        effect: async (action, listenerApi) => {
          const id = (action as unknown as { payload: { id: string } }).payload.id;
          const item = listenerApi.getState().capture.items.find((item) => item.id === id)!;
          host.postMessage({
            command: "saveCaptureSettings",
            payload: {
              id,
              settings: {
                files: item.files,
                prepareOptions: item.prepareOptions,
              },
            },
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

    sendHttpRequest: onSendHttpRequest(startAppListening, host),
  };

  startNavigationListening(startAppListening, routes);
  startListeners({ ...listeners, onShowCaptureWindow });
  return listenerMiddleware;
}
