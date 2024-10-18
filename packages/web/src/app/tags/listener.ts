import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/tags";

import { onSendHttpRequest } from "../../features/http-client/listener";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import { saveTags } from "./slice";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    sendHttpRequest: onSendHttpRequest(startAppListening, host),
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
