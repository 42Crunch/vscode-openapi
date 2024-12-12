import { isAnyOf, TypedStartListening, UnsubscribeListener } from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/scanconf";
import { serialize } from "@xliic/scanconf";

import { showEnvWindow } from "../../../features/env/slice";
import { setScanServer } from "../../../features/prefs/slice";
import { onOpenLink } from "../../../features/router/listener";
import { runFullScan, runScan, sendHttpRequest } from "../actions";
import {
  addAuthorizationTest,
  addCredential,
  addStage,
  moveStage,
  removeAuthorizationTest,
  removeCredential,
  removeRequest,
  removeStage,
  saveAuthorizationTest,
  saveCredential,
  saveEnvironment,
  saveOperationReference,
  saveRequest,
  saveSettings,
  updateOperationAuthorizationTests,
  createVariable,
  removeCustomizationForOperation,
} from "../slice";
import { updateScanconf } from "../scanconf-update/slice";
import { AppDispatch, RootState } from "../store";

const listeners = (
  startAppListening: TypedStartListening<RootState, AppDispatch>,
  host: Webapp["host"]
): Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> => {
  return {
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

    runFullScan: () =>
      startAppListening({
        actionCreator: runFullScan,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "runFullScan",
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
          removeCredential,
          addStage,
          moveStage,
          removeStage,
          saveOperationReference,
          saveEnvironment,
          removeRequest,
          saveAuthorizationTest,
          removeAuthorizationTest,
          addAuthorizationTest,
          updateOperationAuthorizationTests,
          createVariable,
          removeCustomizationForOperation
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

    openLink: onOpenLink(startAppListening, host),

    updateScanconf: () =>
      startAppListening({
        actionCreator: updateScanconf,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "updateScanconf",
            payload: undefined,
          });
        },
      }),
  };
};

export default listeners;
