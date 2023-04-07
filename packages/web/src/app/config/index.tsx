import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/config";

import { initStore } from "./store";
import { createListener } from "./listener";

import { makeWebappMessageHandler } from "../webapp";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import { loadConfig } from "../../features/config/slice";
import { Test } from "./Test";

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  loadConfig,
};

function App() {
  return (
    <>
      <ThemeStyles />
      <Test />
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
