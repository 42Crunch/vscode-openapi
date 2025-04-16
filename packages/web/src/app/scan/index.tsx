import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/scan";
import { makeWebappMessageHandler } from "../webapp";

import { initStore, useAppDispatch, useAppSelector } from "./store";
import { createListener } from "./listener";

import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import Router from "../../features/router/Router";
import { RouterContext, Routes } from "../../features/router/RouterContext";

import {
  startScan,
  scanOperation,
  showScanReport,
  showFullScanReport,
  showGeneralError,
  showHttpError,
  showHttpResponse,
  parseChunk,
  startInitDb,
  sendInitDbComplete,
  sendParseChunkComplete,
} from "./slice";

import { loadEnv } from "../../features/env/slice";
import { loadPrefs } from "../../features/prefs/slice";
import { loadConfig } from "../../features/config/slice";
import { showLogMessage } from "../../features/logging/slice";

import ScanOperation from "./ScanOperation";
import { initProcessReport, processReport } from "../../json-streaming-parser/worker";
import { getScanv1Db } from "../../json-streaming-parser/scanv1-processor";

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
  startInitDb,
  parseChunk,
};

function App() {
  const dispatch = useAppDispatch();
  const { initDbStarted, chunkId, chunkText, progress } = useAppSelector((state) => state.scan);

  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    if (initDbStarted) {
      initProcessReport("vscode.scan.db")
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
      processReport(progress === 1.0, chunkText).then(() => {
        dispatch(sendParseChunkComplete({ id: chunkId }));
        if (progress === 1.0) {
          const dbService = getScanv1Db();
          //debugger;
          dbService.getIssuesList().then((issues) => {
            setIssues(issues);
            // for (const issue of issues) {
            //   console.info("issue = " + issue);
            // }
          });
        }
      });
    }
  }, [chunkId]);

  return (
    <>
      {issues.length > 0 && <ScanIssuesV2 issues={issues} />}
      <ThemeStyles />
      <Router />
    </>
  );
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

export default function ScanIssuesV2({ issues }: { issues: any[] }) {
  if (issues.length === 0) {
    return (
      <div>
        <div>No test results available</div>
      </div>
    );
  }
  return (
    <div>
      <div />
      {issues.map((issue) => (
        <div key={issue.id}>
          <div>desc {issue.injectionDescription}</div>
          <div>jsonPointer {issue.jsonPointer}</div>
        </div>
      ))}
    </div>
  );
}
