import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/capture";

import { ThemeState } from "../../features/theme/slice";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import { makeWebappMessageHandler, NavigationRouterApp } from "../webapp";
import { createListener } from "./listener";
import { initStore, messageHandlers } from "./store";
import Capture2 from "./Capture2";
import { RootContainer } from "./Capture";

const routes: Routes = [
  {
    id: "starting",
    title: "",
    navigation: false,
    element: <div />,
  },
  {
    id: "capture",
    title: "Capture",
    element: <div>Main</div>,
    children: [
      {
        id: "capture2",
        title: "Capture 2",
        element: <Capture2 />,
      },
      {
        id: "capture1",
        title: "Capture 1",
        element: <RootContainer />,
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
          <NavigationRouterApp />
        </RouterContext.Provider>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
