import { Webapp } from "@xliic/common/webapp/scanconf-graphql";
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
import Requests from "./requests/Requests";
import { initStore, messageHandlers } from "./store";
import Environments from "../scanconf/environment/Environments";
import Settings from "../scanconf/settings/Settings";
import EnvironmentsNavigationTab from "../scanconf/environment/EnvironmentsNavigationTab";
import UpdatePrompt from "../scanconf/scanconf-update/UpdatePrompt";
import GeneralError from "../../features/general-error/GeneralError";
import { showGeneralError } from "../../features/general-error/slice";

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
        id: "auth",
        title: "Authentication",
        element: <Auth />,
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
