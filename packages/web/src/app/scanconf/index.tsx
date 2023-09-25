import { Webapp } from "@xliic/common/webapp/scanconf";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import { ThemeState } from "../../features/theme/slice";
import { NavigationRouterApp, makeWebappMessageHandler } from "../webapp";
import { showScanconfAuth, showScanconfOperation } from "./actions";
import Auth from "./auth/Auth";
import { createListener } from "./listener";
import Operations from "./operations/Operations";
import Requests from "./requests/Requests";
import { initStore, messageHandlers } from "./store";
import Environments from "./environment/Environments";
import Global from "./global/Global";
import Settings from "./settings/Settings";

const routes: Routes = [
  {
    id: "requests",
    title: "Requests",
    element: <Requests />,
  },
  {
    id: "operations",
    title: "Scenarios",
    element: <Operations />,
    when: showScanconfOperation,
  },
  {
    id: "auth",
    title: "Authentication",
    element: <Auth />,
    when: showScanconfAuth,
  },
  {
    id: "global",
    title: "Global Context",
    element: <Global />,
  },
  {
    id: "environments",
    title: "Environment",
    element: <Environments />,
  },
  {
    id: "settings",
    title: "Settings",
    element: <Settings />,
  },
];

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host, routes), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterContext.Provider value={routes}>
          <DndProvider backend={HTML5Backend}>
            <NavigationRouterApp />
          </DndProvider>
        </RouterContext.Provider>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
