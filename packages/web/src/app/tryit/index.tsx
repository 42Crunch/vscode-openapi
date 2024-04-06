import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/tryit";
import { makeWebappMessageHandler } from "../webapp";

import { initStore } from "./store";
import { createListener } from "./listener";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import Router from "../../features/router/Router";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import { showHttpResponse, showHttpError, tryOperation } from "./slice";
import { loadEnv } from "../../features/env/slice";
import { loadPrefs } from "../../features/prefs/slice";
import { loadConfig } from "../../features/config/slice";

import TryOperation from "./TryOperation";

const routes: Routes = [
  { id: "starting", title: "Starting", element: <div /> },
  {
    id: "tryit",
    title: "Try It",
    element: <TryOperation />,
    when: tryOperation,
  },
];

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  tryOperation,
  showHttpResponse,
  showHttpError,
  loadEnv,
  loadPrefs,
  loadConfig,
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
