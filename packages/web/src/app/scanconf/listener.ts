import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/scanconf";

import { startNavigationListening } from "../../features/router/listener";
import { onSendHttpRequest } from "../../features/http-client/listener";
import { onConfirmationAccept } from "../../features/confirmation-dialog/listener";
import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";
import {
  onExecuteAuthentication,
  onExecuteGlobal,
  onExecuteRequest,
  onMockExecuteAuthRequests,
  onMockExecuteGlobal,
  onMockExecuteRequest,
  onMockExecuteScenario,
  onTryExecuteScenario,
} from "./listener-run-playbook";
import { onShowScanconf, onLoadUpdatedScanconf } from "./listeners/host-messages";
import listeners from "./listeners/webapp-messages";
import { AppDispatch, RootState } from "./store";
import { onScanconfSkipUpdate } from "./listeners/misc";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const executeTryScenarioListener = onTryExecuteScenario(startAppListening, host);
  const executeMockScenarioListener = onMockExecuteScenario(startAppListening, host);
  const executeMockRequestListener = onMockExecuteRequest(startAppListening, host);
  const executeRequestListener = onExecuteRequest(startAppListening, host);
  const executeMockAuthRequestsListener = onMockExecuteAuthRequests(startAppListening, host);
  const executeTryAuthenticationListener = onExecuteAuthentication(startAppListening, host);
  const executeTryGlobalListener = onExecuteGlobal(startAppListening, host);
  const executeMockGlobalListener = onMockExecuteGlobal(startAppListening, host);

  const executeWebappMessages = listeners(startAppListening, host);

  startNavigationListening(startAppListening, routes);
  startListeners({
    ...executeWebappMessages,
    executeTryScenarioListener,
    executeMockScenarioListener,
    executeRequestListener,
    executeMockRequestListener,
    executeMockAuthRequestsListener,
    executeTryAuthenticationListener,
    executeTryGlobalListener,
    executeMockGlobalListener,
    executeSendHttpRequestListener: onSendHttpRequest(startAppListening, host),
    executeConfirmationAccept: onConfirmationAccept(startAppListening),
    executeShowScanconfOperationListener: onShowScanconf(startAppListening),
    executeLoadUpdatedScanconfListener: onLoadUpdatedScanconf(startAppListening, host),
    executeSkipScanconfUpdate: onScanconfSkipUpdate(startAppListening),
  });

  return listenerMiddleware;
}
