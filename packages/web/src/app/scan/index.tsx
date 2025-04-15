import React, { useEffect } from "react";
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
} from "./slice";

import { loadEnv } from "../../features/env/slice";
import { loadPrefs } from "../../features/prefs/slice";
import { loadConfig } from "../../features/config/slice";
import { showLogMessage } from "../../features/logging/slice";

import ScanOperation from "./ScanOperation";
import { initProcessReport } from "../../json-streaming-parser/worker";

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
  const { initDbStarted } = useAppSelector((state) => state.scan);

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

  // useEffect(() => {
  //   if (initDbStatus) {
  //     dispatch(sendInitDbComplete({ status: initDbStatus, message: initDbError }));
  //   }
  // }, [initDbStatus]);

  return (
    <>
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
