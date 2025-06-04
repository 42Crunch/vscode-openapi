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
let times: number[] = [];
let chunkSize = 0;

/////////////////

// Solution 1
// const workerUrl = "../../json-streaming-parser/worker.ts"; //"http://localhost:3000/src/json-streaming-parser/worker.ts"; // '../../json-streaming-parser/worker.ts';
// const workerBlob = new Blob(["importScripts(" + JSON.stringify(workerUrl) + ")"], {
//   type: "application/javascript",
// });
// const blobUrl = window.URL.createObjectURL(workerBlob);
// const worker = new Worker(blobUrl);

// Solution 2
// const cross_origin_script_url = "http://localhost:3000/src/json-streaming-parser/worker.ts";

// const worker_url = getWorkerURL(cross_origin_script_url);
// const worker = new Worker(worker_url);
// worker.onmessage = (evt) => console.log(evt.data);
// URL.revokeObjectURL(worker_url);

// // Returns a blob:// URL which points
// // to a javascript file which will call
// // importScripts with the given URL
// function getWorkerURL(url: string) {
//   const content = `importScripts( "${url}" );`;
//   return URL.createObjectURL(new Blob([content], { type: "text/javascript" }));
// }

// Solution 3 (blob)

// It's not possible to load a web worker from a different domain.
// Similar to your suggestion, you could make a fetch call, then take that JS and base64 it. Doing so allows you to do:
// const worker = new Worker(`data:text/javascript;base64,${btoa(workerJs)}`)

// const worker: Worker = new Worker(
//   new URL("../../json-streaming-parser/worker.ts", import.meta.url)
// );

const worker = undefined;

/////////////////

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
          if (worker) {
            // worker.postMessage({
            //   type: "init",
            //   dbName: "vscode.scan.v2.db",
            //   progress: 0,
            //   chunkText: "",
            // });
            // worker.onmessage = (message: MessageEvent) => {
            //   if (message.data) {
            //     host.postMessage(message.data);
            //   }
            // };
            // worker.onerror = (err: ErrorEvent) => {
            //   console.error(`Worker sendInitDbComplete failed: ${err.error}`);
            // };
          } else {
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
          }
        },
      }),

    sendParseChunkComplete: () =>
      startAppListening({
        actionCreator: parseChunk,
        effect: async (action, listenerApi) => {
          const state = listenerApi.getState();
          const done = state.scan.progress === 1.0;
          if (worker) {
            // worker.postMessage({
            //   type: "parse",
            //   dbName: "",
            //   progress: state.scan.progress,
            //   chunkText: state.scan.chunkText,
            // });
            // worker.onmessage = (message: MessageEvent) => {
            //   if (message.data) {
            //     host.postMessage({
            //       command: "sendParseChunkComplete",
            //       payload: { id: state.scan.chunkId },
            //     });
            //     if (done) {
            //       //setTimeDelta(new Date().getTime() - timeDelta);
            //       const dbService = getScanv2Db();
            //       dbService.getReport().then((report) => {
            //         //const start = new Date().getTime();
            //         dbService
            //           .getIssues(state.scan.pageIndex, perPage)
            //           .then((resp: PaginationResponse) => {
            //             //const end = new Date().getTime();
            //             // console.info(
            //             //   "### db delay " + (end - start) / 1000 + ", issues = " + issues.length
            //             // );
            //             //setTotalItems(resp.filteredItems);
            //             listenerApi.dispatch(setTotalItems({ size: resp.totalItems }));
            //             listenerApi.dispatch(
            //               showFullScanReport2({
            //                 pageIndex: state.scan.pageIndex,
            //                 issues: resp.list,
            //                 report,
            //               })
            //             );
            //           });
            //       });
            //     }
            //   }
            // };
            // worker.onerror = (err: ErrorEvent) => {
            //   console.error(`Worker sendInitDbComplete failed: ${err.error}`);
            // };
          } else {
            chunkSize = Math.max(chunkSize, state.scan.chunkText.length);
            const t1 = performance.now();
            processReport(done, state.scan.chunkText).then(() => {
              const t2 = performance.now();
              times.push(t2 - t1);
              host.postMessage({
                command: "sendParseChunkComplete",
                payload: { id: state.scan.chunkId },
              });
              if (done) {
                const sum = times.reduce((x, a) => x + a, 0);
                console.info(
                  "Total = " +
                    sum.toFixed(2) +
                    ", avg = " +
                    (sum / times.length).toFixed(2) +
                    ", max = " +
                    Math.max(...times).toFixed(2) +
                    ", min = " +
                    Math.min(...times).toFixed(2) +
                    ", parsing calls = " +
                    times.length +
                    ", chunk length = " +
                    chunkSize
                );
                times = [];
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
          }
        },
      }),
  };

  startNavigationListening(startAppListening, routes);
  startListeners(listeners);

  return listenerMiddleware;
}
