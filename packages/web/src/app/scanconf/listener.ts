import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/scanconf";
import { serialize } from "../../core/playbook/scanconf-serializer";
import { startNavigationListening } from "../../features/router/listener";
import { showEnvWindow } from "../../features/env/slice";

import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";
import { sendHttpRequest, runScan } from "./actions";
import {
  onMockExecuteScenario,
  onExecuteRequest,
  onTryExecuteScenario,
} from "./listener-run-playbook";
import { saveScanconf } from "./slice";
import { AppDispatch, RootState } from "./store";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    runScan: () =>
      startAppListening({
        actionCreator: runScan,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "runScan",
            payload: action.payload,
          });
        },
      }),

    saveScanconf: () =>
      startAppListening({
        actionCreator: saveScanconf,
        effect: async (action, listenerApi) => {
          const { scanconf: state } = listenerApi.getState();

          const [serialized, error] = serialize(state.oas, state.playbook);
          if (error !== undefined) {
            // FIXME show error when serializing
            return;
          }

          const scanconf = JSON.stringify(
            { ...state.scanconf, authenticationDetails: serialized.authenticationDetails },
            null,
            2
          );

          host.postMessage({
            command: "saveScanconf",
            payload: scanconf,
          });
        },
      }),

    sendHttpRequest: () =>
      startAppListening({
        actionCreator: sendHttpRequest,
        effect: async (action, listenerApi) => {
          const { id, request, config } = action.payload;
          host.postMessage({ command: "sendHttpRequest", payload: { id, request, config } });
        },
      }),

    showEnvWindow: () =>
      startAppListening({
        actionCreator: showEnvWindow,
        effect: async (action, listenerApi) => {
          host.postMessage({ command: "showEnvWindow", payload: undefined });
        },
      }),
  };

  const executeTryScenarioListener = onTryExecuteScenario(startAppListening, host);
  const executeMockScenarioListener = onMockExecuteScenario(startAppListening, host);
  const executeRequestListener = onExecuteRequest(startAppListening, host);

  startNavigationListening(startAppListening, routes);
  startListeners({
    ...listeners,
    executeTryScenarioListener,
    executeMockScenarioListener,
    executeRequestListener,
  });

  return listenerMiddleware;
}