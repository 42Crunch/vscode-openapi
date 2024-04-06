import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/audit";

import { initStore } from "./store";
import { createListener } from "./listener";

import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";
import { makeWebappMessageHandler } from "../webapp";
import {
  showFullReport,
  showPartialReport,
  showNoReport,
  loadKdb,
  startAudit,
  cancelAudit,
} from "./slice";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import Router from "../../features/router/Router";

import AuditReport from "./AuditReport";
import NoReport from "./NoReport";
import Loading from "./Loading";

const routes: Routes = [
  { id: "starting", title: "Starting", element: <div /> },
  { id: "blank", title: "Blank", element: <div />, when: cancelAudit },
  {
    id: "start-audit",
    title: "Audit is starting",
    element: <Loading />,
    when: startAudit,
  },
  {
    id: "no-report",
    title: "No Audit Report",
    element: <NoReport />,
    when: showNoReport,
  },
  {
    id: "audit-report",
    title: "Security Audit",
    element: <AuditReport />,
    when: showFullReport,
  },
  {
    id: "audit-report",
    title: "Security Audit",
    element: <AuditReport />,
    when: showPartialReport,
  },
];

const messageHandlers: Webapp["webappHandlers"] = {
  startAudit,
  cancelAudit,
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
      <Router />
    </>
  );
}

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host, routes), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterContext.Provider value={routes}>
          <App />
        </RouterContext.Provider>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;
