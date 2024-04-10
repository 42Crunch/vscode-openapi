import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/scan";
import { makeWebappMessageHandler } from "../webapp";

import { initStore } from "./store";
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
} from "./slice";

import { loadEnv } from "../../features/env/slice";
import { loadPrefs } from "../../features/prefs/slice";
import { loadConfig } from "../../features/config/slice";
import { showLogMessage } from "../../features/logging/slice";

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
};

function App() {
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
