import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/capture";

import { ThemeState } from "../../features/theme/slice";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import GeneralError from "../../features/general-error/GeneralError";
import { showGeneralError } from "../../features/general-error/slice";
import { makeWebappMessageHandler, RouterApp } from "../webapp";
import { createListener } from "./listener";
import { initStore, messageHandlers } from "./store";
import Capture from "./Capture";

const routes: Routes = [
  {
    id: "starting",
    title: "",
    navigation: false,
    element: <div />,
  },
  {
    id: "main",
    title: "Main",
    element: <div>Main</div>,
    children: [
      {
        id: "capture",
        title: "Capture",
        element: (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
            <Capture />
          </div>
        ),
      },
    ],
  },
];

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host, routes), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterContext.Provider value={routes}>
          <RouterApp />
        </RouterContext.Provider>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
