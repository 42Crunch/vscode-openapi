import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/data-dictionary";

import { initStore } from "./store";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import { makeWebappMessageHandler } from "../webapp";

import { showDictionary } from "./slice";

import Main from "./Main";

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showDictionary,
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
  const store = initStore(theme);

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
