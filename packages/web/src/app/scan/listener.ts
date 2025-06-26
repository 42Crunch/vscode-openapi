import {
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/scan";
import { AppDispatch, RootState } from "./store";
import { showEnvWindow } from "../../features/env/slice";
import { setSecretForSecurity, setScanServer } from "../../features/prefs/slice";
import {
  sendCurlRequest,
  showJsonPointer,
  parseChunkCompleted,
  parseChunk,
  started,
  loadHappyPathPage,
  happyPathPageLoaded,
  reportLoaded,
  loadTestsPage,
  testsPageLoaded,
  changeFilter,
} from "./slice";

import { startNavigationListening } from "../../features/router/listener";
import { Routes } from "../../features/router/RouterContext";
import { startListeners } from "../webapp";
import { ReportDb } from "./db/reportdb";
import { ScanReportParser } from "./db/scanreportparser";
import { stores } from "./db/schema";
import { getDexieStores } from "@xliic/streaming-parser";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"], routes: Routes) {
  let schema = stores();
  const reportDb = new ReportDb("scanv2-report", getDexieStores(schema));
  let parser = new ScanReportParser(reportDb, schema);

  const onParseChunk = () =>
    startAppListening({
      actionCreator: parseChunk,
      effect: async (action, listenerApi) => {
        const completed = await parser.parse(action.payload);
        listenerApi.dispatch(parseChunkCompleted());
        if (completed) {
          listenerApi.dispatch(loadHappyPathPage(0));
          listenerApi.dispatch(loadTestsPage(0));
        }
      },
    });

  const onLoadHappyPathPage = () =>
    startAppListening({
      actionCreator: loadHappyPathPage,
      effect: async (action, listenerApi) => {
        const happyPaths = await reportDb.getHappyPaths(action.payload, 100, undefined);
        listenerApi.dispatch(happyPathPageLoaded(happyPaths));
        listenerApi.dispatch(
          reportLoaded({
            scanVersion: parser.getScanVersion(),
            summary: parser.getSummary(),
            stats: parser.getStats(),
            paths: await reportDb.getStrings("pathIndex"),
            operationIds: await reportDb.getStrings("operationIdIndex"),
            testKeys: await reportDb.getStrings("testKeyIndex"),
          })
        );
      },
    });

  const onLoadTestsPage = () =>
    startAppListening({
      actionCreator: loadTestsPage,
      effect: async (action, listenerApi) => {
        const {
          scan: { filter },
        } = listenerApi.getState();
        const tests = await reportDb.getTests(action.payload, 100, undefined, filter);
        listenerApi.dispatch(testsPageLoaded(tests));
      },
    });

  const onChangeFilter = () =>
    startAppListening({
      actionCreator: changeFilter,
      effect: async (action, listenerApi) => {
        const {
          scan: { filter },
        } = listenerApi.getState();
        const tests = await reportDb.getTests(0, 100, undefined, filter);
        listenerApi.dispatch(testsPageLoaded(tests));
      },
    });

  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    started: () =>
      startAppListening({
        actionCreator: started,
        effect: async (action, listenerApi) => {
          await reportDb.initDb();
          host.postMessage({ command: "started", payload: crypto.randomUUID() });
        },
      }),

    parseChunkCompleted: () =>
      startAppListening({
        actionCreator: parseChunkCompleted,
        effect: async (action, listenerApi) => {
          host.postMessage({ command: "parseChunkCompleted", payload: undefined });
        },
      }),

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
  };

  startNavigationListening(startAppListening, routes);
  startListeners({
    ...listeners,
    onParseChunk,
    onLoadHappyPathPage,
    onLoadTestsPage,
    onChangeFilter,
  });

  return listenerMiddleware;
}
