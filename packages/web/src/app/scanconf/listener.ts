import {
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/scanconf";
import { serialize } from "../../core/playbook/scanconf-serializer";
import { showEnvWindow } from "../../features/env/slice";
import { startNavigationListening } from "../../features/router/listener";
import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";
import { runScan, sendHttpRequest } from "./actions";
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
import {
  saveRequest,
  saveCredential,
  addCredential,
  addStage,
  moveStage,
  removeStage,
  saveOperationReference,
  saveSettings,
  saveEnvironment,
  removeRequest,
} from "./slice";
import { AppDispatch, RootState } from "./store";
import { setScanServer } from "../../features/prefs/slice";

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
        matcher: isAnyOf(
          saveRequest,
          saveSettings,
          saveCredential,
          addCredential,
          addStage,
          moveStage,
          removeStage,
          saveOperationReference,
          saveEnvironment,
          removeRequest
        ),
        effect: async (action, listenerApi) => {
          const { scanconf: state } = listenerApi.getState();

          const [serialized, error] = serialize(state.oas, state.playbook);
          if (error !== undefined) {
            // FIXME show error when serializing
            return;
          }

          const scanconf = JSON.stringify(serialized, null, 2);

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

    savePrefs: () =>
      startAppListening({
        actionCreator: setScanServer,
        effect: async (action, listenerApi) => {
          const { prefs } = listenerApi.getState();
          host.postMessage({
            command: "savePrefs",
            payload: prefs,
          });
        },
      }),
  };

  const executeTryScenarioListener = onTryExecuteScenario(startAppListening, host);
  const executeMockScenarioListener = onMockExecuteScenario(startAppListening, host);
  const executeMockRequestListener = onMockExecuteRequest(startAppListening, host);
  const executeRequestListener = onExecuteRequest(startAppListening, host);
  const executeMockAuthRequestsListener = onMockExecuteAuthRequests(startAppListening, host);
  const executeTryAuthenticationListener = onExecuteAuthentication(startAppListening, host);
  const executeTryGlobalListener = onExecuteGlobal(startAppListening, host);
  const executeMockGlobalListener = onMockExecuteGlobal(startAppListening, host);

  startNavigationListening(startAppListening, routes);
  startListeners({
    ...listeners,
    executeTryScenarioListener,
    executeMockScenarioListener,
    executeRequestListener,
    executeMockRequestListener,
    executeMockAuthRequestsListener,
    executeTryAuthenticationListener,
    executeTryGlobalListener,
    executeMockGlobalListener,
  });

  return listenerMiddleware;
}
