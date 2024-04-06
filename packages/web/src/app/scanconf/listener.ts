import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/scanconf";

import { startNavigationListening } from "../../features/router/listener";
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
import { onShowScanconf } from "./listeners/host-messages";
import listeners from "./listeners/webapp-messages";
import { AppDispatch, RootState } from "./store";

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

  const executeShowScanconfOperationListener = onShowScanconf(startAppListening);
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
    executeShowScanconfOperationListener,
  });

  return listenerMiddleware;
}
