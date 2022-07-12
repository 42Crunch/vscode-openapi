import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { ThemeRequests } from "@xliic/common/messages/theme";
import { DataDictionaryRequest } from "@xliic/common/messages/data-dictionary";

import { HostApplication } from "./types";
import App from "./components/App";

import { initStore } from "./store/store";
import { changeTheme, ThemeState } from "@xliic/web-theme";
import { showDictionary } from "./store/formatsSlice";

import "bootstrap/dist/css/bootstrap.min.css";

type WebAppRequest = ThemeRequests | DataDictionaryRequest;

const requestHandlers: Record<WebAppRequest["command"], Function> = {
  changeTheme,
  showDictionary,
};

function renderWebView(host: HostApplication, theme: ThemeState) {
  const store = initStore(host, theme);
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
