import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/audit";

import { initStore } from "./store";
import { createListener } from "./listener";

import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import { makeWebappMessageHandler } from "../webapp";
import { showFullReport, showPartialReport, showNoReport, loadKdb } from "./slice";

import Main from "./components/Main";

import "bootstrap/dist/css/bootstrap.min.css";

const messageHandlers: Webapp["webappHandlers"] = {
  showFullReport,
  showPartialReport,
  showNoReport,
  loadKdb,
  changeTheme,
};

function App() {
  return (
    <>
      <ThemeStyles />
      <Main />
    </>
  );
}

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
