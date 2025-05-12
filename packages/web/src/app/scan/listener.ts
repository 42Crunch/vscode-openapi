import {
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/scan";
import { showEnvWindow } from "../../features/env/slice";
import { setScanServer, setSecretForSecurity } from "../../features/prefs/slice";
import {
  parseChunk,
  sendCurlRequest,
  sendHttpRequest,
  setTotalItems,
  showFullScanReport2,
  showJsonPointer,
  startInitDb,
  startScan,
} from "./slice";
import { AppDispatch, RootState } from "./store";

import { startNavigationListening } from "../../features/router/listener";
import { Routes } from "../../features/router/RouterContext";
import { PaginationResponse } from "../../json-streaming-parser/models/pagination.model";
import { getScanv2Db } from "../../json-streaming-parser/scanv2-processor";
import { initProcessReport, processReport } from "../../json-streaming-parser/worker";
import { startListeners } from "../webapp";

export const perPage = 20;
const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    savePrefs: () =>
      startAppListening({
        matcher: isAnyOf(setScanServer, setSecretForSecurity),
        effect: async (action, listenerApi) => {
          const { prefs } = listenerApi.getState();
          host.postMessage({
            command: "savePrefs",
            payload: prefs,
          });
        },
      }),

    sendHttpRequest: () =>
      startAppListening({
        actionCreator: sendHttpRequest,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "sendHttpRequest",
            payload: action.payload,
          });
        },
      }),

    sendCurlRequest: () =>
      startAppListening({
        actionCreator: sendCurlRequest,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "sendCurlRequest",
            payload: action.payload,
          });
        },
      }),

    showJsonPointer: () =>
      startAppListening({
        actionCreator: showJsonPointer,
        effect: async (action, listenerApi) => {
          host.postMessage({
            command: "showJsonPointer",
            payload: action.payload,
          });
        },
      }),

    showEnvWindow: () =>
      startAppListening({
        actionCreator: showEnvWindow,
        effect: async (action, listenerApi) => {
          host.postMessage({ command: "showEnvWindow", payload: undefined });
        },
      }),

    sendInitDbComplete: () =>
      startAppListening({
        actionCreator: startInitDb,
        effect: async (action, listenerApi) => {
          listenerApi.dispatch(startScan(undefined));
          initProcessReport("vscode.scan.v2.db")
            .then(() => {
              host.postMessage({
                command: "sendInitDbComplete",
                payload: { status: true, message: "" },
              });
            })
            .catch((e: any) => {
              host.postMessage({
                command: "sendInitDbComplete",
                payload: {
                  status: false,
                  message: `Failed to connect to the database: ${e.message}`,
                },
              });
            });
        },
      }),

    sendParseChunkComplete: () =>
      startAppListening({
        actionCreator: parseChunk,
        effect: async (action, listenerApi) => {
          const state = listenerApi.getState();
          const done = state.scan.progress === 1.0;
          processReport(done, state.scan.chunkText).then(() => {
            host.postMessage({
              command: "sendParseChunkComplete",
              payload: { id: state.scan.chunkId },
            });
            if (done) {
              //setTimeDelta(new Date().getTime() - timeDelta);
              const dbService = getScanv2Db();
              dbService.getReport().then((report) => {
                //const start = new Date().getTime();
                dbService
                  .getIssues(state.scan.pageIndex, perPage)
                  .then((resp: PaginationResponse) => {
                    //const end = new Date().getTime();
                    // console.info(
                    //   "### db delay " + (end - start) / 1000 + ", issues = " + issues.length
                    // );
                    //setTotalItems(resp.filteredItems);
                    listenerApi.dispatch(setTotalItems({ size: resp.totalItems }));
                    listenerApi.dispatch(
                      showFullScanReport2({
                        pageIndex: state.scan.pageIndex,
                        issues: resp.list,
                        report,
                      })
                    );
                  });
              });
            }
          });
        },
      }),
  };

  startNavigationListening(startAppListening, routes);
  startListeners(listeners);

  return listenerMiddleware;
}
