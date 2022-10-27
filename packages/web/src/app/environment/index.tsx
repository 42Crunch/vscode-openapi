import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/environment";

import { initStore } from "./store";
import { createListener } from "./listener";

import { makeWebappMessageHandler } from "../webapp";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import { loadEnv } from "../../features/env/slice";
import Env from "../../features/env/Env";

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  loadEnv,
};

function App() {
  return (
    <>
      <ThemeStyles />
      <Env />
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
