import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/signup";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import {
  requestAnondTokenByEmail,
  anondSignUpComplete,
  openLink,
  platformSignUpComplete,
} from "./slice";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    requestAnondTokenByEmail: () =>
      startAppListening({
        actionCreator: requestAnondTokenByEmail,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "requestAnondTokenByEmail",
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
    anondSignUpComplete: () =>
      startAppListening({
        actionCreator: anondSignUpComplete,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "anondSignUpComplete",
            payload: action.payload,
          });
        },
      }),
    platformSignUpComplete: () =>
      startAppListening({
        actionCreator: platformSignUpComplete,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "platformSignUpComplete",
            payload: action.payload,
          });
        },
      }),
  };

  startListeners(listeners);

  return listenerMiddleware;
}
