import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/scan";
import { makeWebappMessageHandler } from "../webapp";

import { initStore } from "./store";
import { createListener } from "./listener";

import { ThemeState, changeTheme } from "../../features/theme/slice";
import { RouterContext, Routes } from "../../features/router/RouterContext";

import { showScanReport, showFullScanReport, showGeneralError, parseChunk, started } from "./slice";

import { loadConfig } from "../../features/config/slice";
import { showLogMessage } from "../../features/logging/slice";

import { Application } from "./Application";
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
    when: started,
  },
];

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showGeneralError,
  showScanReport,
  showFullScanReport,
  loadConfig,
  showLogMessage,
  parseChunk,
};

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host, routes), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterContext.Provider value={routes}>
          <Application />
        </RouterContext.Provider>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));

  return { skipAutoStart: true };
}

(window as any).renderWebView = renderWebView;
