import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/vault";

import * as listener from "../../features/vault/listener";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import { startNavigationListening } from "../../features/router/listener";
import { onConfirmationAccept } from "../../features/confirmation-dialog/listener";
import { Routes } from "../../features/router/RouterContext";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const executeWebappMessages: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    saveVault: listener.onVaultChange(startAppListening, host),
  };

  startNavigationListening(startAppListening, routes);
  startListeners({
    ...executeWebappMessages,
    confirmationAccept: onConfirmationAccept(startAppListening),
  });

  return listenerMiddleware;
}
