import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/scan";
import { makeWebappMessageHandler } from "../webapp";

import { createListener } from "./listener";
import { initStore, useAppDispatch, useAppSelector } from "./store";

import Router from "../../features/router/Router";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";

import {
  closeInitDb,
  parseChunk,
  scanOperation,
  sendInitDbComplete,
  sendParseChunkComplete,
  showFullScanReport,
  showFullScanReport2,
  showGeneralError,
  showHttpError,
  showHttpResponse,
  showScanReport,
  startInitDb,
  startScan,
} from "./slice";

import { loadConfig } from "../../features/config/slice";
import { loadEnv } from "../../features/env/slice";
import { showLogMessage } from "../../features/logging/slice";
import { loadPrefs } from "../../features/prefs/slice";

import { getScanv2Db } from "../../json-streaming-parser/scanv2-processor";
import { initProcessReport, processReport } from "../../json-streaming-parser/worker";
import ScanOperation from "./ScanOperation";

const routes: Routes = [
  {
    id: "starting",
    title: "",
    navigation: false,
    element: <div />,
  },
  {
    id: "scan",
    title: "Scan",
    element: <ScanOperation />,
    when: startScan,
  },
];

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  startScan,
  scanOperation,
  showGeneralError,
  showHttpError,
  showHttpResponse,
  showScanReport,
  showFullScanReport,
  loadEnv,
  loadPrefs,
  loadConfig,
  showLogMessage,
  closeInitDb,
  startInitDb,
  parseChunk,
};

function App() {
  const dispatch = useAppDispatch();
  const { initDbStarted, chunkId, chunkText, progress } = useAppSelector((state) => state.scan);

  //const [issues, setIssues] = useState<any[]>([]);
  const [timeDelta, setTimeDelta] = useState<number>(0);
  const [chunkSize, setChunkSize] = useState<number>(0);

  useEffect(() => {
    if (initDbStarted) {
      dispatch(startScan(undefined));
      initProcessReport("vscode.scan.v2.db")
        .then(() => {
          dispatch(sendInitDbComplete({ status: true, message: "" }));
        })
        .catch((e: any) => {
          dispatch(
            sendInitDbComplete({
              status: false,
              message: `Failed to connect to the database: ${e.message}`,
            })
          );
        });
    }
  }, [initDbStarted]);

  useEffect(() => {
    if (chunkId >= 0) {
      console.info("chunkId = " + chunkId + ", progress = " + progress);
      if (chunkId === 0) {
        // first chunk
        setChunkSize(chunkText.length);
        setTimeDelta(new Date().getTime());
      }
      processReport(progress === 1.0, chunkText).then(() => {
        dispatch(sendParseChunkComplete({ id: chunkId }));
        if (progress === 1.0) {
          setTimeDelta(new Date().getTime() - timeDelta);
          const dbService = getScanv2Db();
          dbService.getIssuesList().then((issues) => {
            dbService.getReport().then((report) => {
              dispatch(showFullScanReport2({ issues, report }));
            });
          });
        }
      });
    }
  }, [chunkId]);

  return (
    <>
      {chunkSize && <div>{"chunkSize = " + chunkSize / 1024 + " KB"}</div>}
      {progress === 1.0 && timeDelta > 0 && (
        <div>{"timeDelta  = " + timeDelta / 1000 + " seconds"}</div>
      )}
      <ThemeStyles />
      <Router />
    </>
  );

  // return (
  //   <>
  //     {chunkId >= 0 && <div>{"chunks = " + (chunkId + 1)}</div>}
  //     {chunkSize && <div>{"chunkSize = " + chunkSize / 1024 + " KB"}</div>}
  //     {issues && <div>{"issues  = " + issues.length}</div>}
  //     {progress === 1.0 && timeDelta > 0 && (
  //       <div>{"timeDelta  = " + timeDelta / 1000 + " seconds"}</div>
  //     )}
  //     {/* {issues.length > 0 && <ScanIssuesV2 issues={issues} />} */}
  //     <ThemeStyles />
  //     <Router />
  //   </>
  // );
}

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host, routes), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterContext.Provider value={routes}>
          <App />
        </RouterContext.Provider>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
