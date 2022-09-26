import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./components/App";

import { initStore } from "./store/store";
import { changeTheme, ThemeState } from "@xliic/web-theme";
import { showResponse, showError, tryOperation } from "./features/tryit/slice";
import { scanOperation, showScanReport, showScanResponse } from "./features/scan/slice";
import { loadEnv } from "./features/env/slice";
import { loadPrefs } from "./features/prefs/slice";

import { WebAppRequest, HostApplication } from "./types";
import createListener from "./store/listener";

import "bootstrap/dist/css/bootstrap.min.css";

const requestHandlers: Record<WebAppRequest["command"], Function> = {
  changeTheme,
  scanOperation,
  tryOperation,
  showResponse,
  showScanResponse,
  showError,
  showScanReport,
  loadEnv,
  loadPrefs,
};

function renderWebView(host: HostApplication, theme: ThemeState) {
  const store = initStore(createListener(host), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", (event) => {
    const { command, payload } = event.data as WebAppRequest;
    if (command) {
      const handler = requestHandlers[command];
      if (handler) {
        store.dispatch(handler(payload));
      } else {
        console.error(`Unable to find handler for command: ${command}`);
      }
    } else {
      console.error("Received message with unknown command", event.data);
    }
  });
}

(window as any).renderWebView = renderWebView;
