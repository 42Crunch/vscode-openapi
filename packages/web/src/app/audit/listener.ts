import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
  isAnyOf,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/audit";
import { AppDispatch, RootState } from "./store";
import {
  goToLine,
  copyIssueId,
  openLink,
  showFullReport,
  showPartialReport,
  showNoReport,
  goToFullReport,
} from "./slice";
import { startListeners } from "../webapp";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    goToLine: () =>
      startAppListening({
        actionCreator: goToLine,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "goToLine",
            payload: action.payload,
          });
        },
      }),

    copyIssueId: () =>
      startAppListening({
        actionCreator: copyIssueId,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "copyIssueId",
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

  startAppListening({
    matcher: isAnyOf(showFullReport, showPartialReport, showNoReport, goToFullReport),
    effect: async (action, listenerApi) => {
      window.scrollTo(0, 0);
    },
  });

  startListeners(listeners);

  return listenerMiddleware;
}
