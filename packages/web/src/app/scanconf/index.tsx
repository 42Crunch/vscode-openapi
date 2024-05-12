import { Webapp } from "@xliic/common/webapp/scanconf";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import { ThemeState } from "../../features/theme/slice";
import { NavigationRouterApp, makeWebappMessageHandler } from "../webapp";
import Auth from "./auth/Auth";
import { createListener } from "./listener";
import Operations from "./operations/Operations";
import Requests from "./requests/Requests";
import { initStore, messageHandlers } from "./store";
import Environments from "./environment/Environments";
import Global from "./global/Global";
import Settings from "./settings/Settings";
import EnvironmentsNavigationTab from "./environment/EnvironmentsNavigationTab";
import AuthorizationTests from "./authorizationTests/AuthorizationTests";
import UpdatePrompt from "./scanconf-update/UpdatePrompt";
import GeneralError from "../../features/general-error/GeneralError";
import { showGeneralError } from "../../features/general-error/slice";
import Help from "./help/Help";

const routes: Routes = [
  {
    id: "starting",
    title: "",
    navigation: false,
    element: <div />,
  },
  {
    id: "general-error",
    title: "An error has occurred",
    element: <GeneralError />,
    navigation: false,
    when: showGeneralError,
  },
  {
    id: "scanconf-update",
    title: "Scan configuration is outdated",
    element: <UpdatePrompt />,
    navigation: false,
  },
  {
    id: "scanconf",
    title: "Scanconf",
    element: <div>Main</div>,
    children: [
      {
        id: "requests",
        title: "Operations",
        element: <Requests />,
      },
      {
        id: "operations",
        title: "Scenarios",
        element: <Operations />,
      },
      {
        id: "global",
        title: "Global blocks",
        element: <Global />,
      },
      {
        id: "auth",
        title: "Authentication",
        element: <Auth />,
      },
      {
        id: "authorizationTests",
        title: "Tests",
        element: <AuthorizationTests />,
      },
      {
        id: "environments",
        title: <EnvironmentsNavigationTab />,
        element: <Environments />,
      },
      {
        id: "settings",
        title: "Settings",
        element: <Settings />,
      },

      {
        id: "help",
        title: "Help",
        element: <Help />,
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
