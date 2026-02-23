import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/scanconf-graphql";

import { startNavigationListening } from "../../features/router/listener";
import { onSendHttpRequest } from "../../features/http-client/listener";
import { onConfirmationAccept } from "../../features/confirmation-dialog/listener";
import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";
import { onShowScanconf, onLoadUpdatedScanconf } from "./listeners/host-messages";
import listeners from "./listeners/webapp-messages";
import { AppDispatch, RootState } from "./store";
import { onScanconfSkipUpdate } from "./listeners/misc";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const executeWebappMessages = listeners(startAppListening, host);

  startNavigationListening(startAppListening, routes);
  startListeners({
    ...executeWebappMessages,
    executeSendHttpRequestListener: onSendHttpRequest(startAppListening, host),
    executeConfirmationAccept: onConfirmationAccept(startAppListening),
    executeShowScanconfOperationListener: onShowScanconf(startAppListening),
    executeLoadUpdatedScanconfListener: onLoadUpdatedScanconf(startAppListening, host),
    executeSkipScanconfUpdate: onScanconfSkipUpdate(startAppListening),
  });

  return listenerMiddleware;
}
