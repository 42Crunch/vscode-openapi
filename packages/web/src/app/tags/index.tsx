import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/tags";

import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState } from "../../features/theme/slice";
import { makeWebappMessageHandler } from "../webapp";
import { createListener } from "./listener";
import { initStore, messageHandlers } from "./store";
import { RootContainer } from "./Tags";

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeStyles />
        <RootContainer />
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
