import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { ThemeRequests } from "@xliic/common/messages/theme";
import { ScanRequest } from "@xliic/common/messages/scan";
import { TryItRequest } from "@xliic/common/messages/tryit";

import App from "./components/App";

import { initStore } from "./store/store";
import { changeTheme, ThemeState } from "@xliic/web-theme";
import {
  showResponse,
  showError,
  scanOperation,
  tryOperation,
  showScanReport,
} from "./store/oasSlice";
import createListener from "./store/listener";
import { HostApplication } from "./types";

import "bootstrap/dist/css/bootstrap.min.css";

type WebAppRequest = ThemeRequests | ScanRequest | TryItRequest;

const requestHandlers: Record<WebAppRequest["command"], Function> = {
  changeTheme,
  scanOperation,
  tryOperation,
  showResponse,
  showError,
  showScanReport,
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
    const handler = requestHandlers[command];
    if (handler) {
      store.dispatch(handler(payload));
    } else {
      throw new Error(`Unable to find handler for command: ${command}`);
    }
  });
}

(window as any).renderWebView = renderWebView;
