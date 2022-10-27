import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/environment";
import { AppDispatch, RootState } from "./store";
import { saveEnv } from "../../features/env/slice";
import { startListeners } from "../webapp";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    saveEnv: () =>
      startAppListening({
        actionCreator: saveEnv,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "saveEnv",
            payload: action.payload,
          });
        },
      }),
  };

  startListeners(listeners);

  return listenerMiddleware;
}
