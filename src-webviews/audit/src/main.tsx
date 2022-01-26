import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { initStore } from "./store";
import { showFullReport, showPartialReport, showNoReport } from "./reportSlice";
import { changeTheme, ThemeState } from "./themeSlice";
import { KdbState } from "./kdbSlice";
import { HostApplication } from "./types";

import App from "./components/App";

import "./bootstrap.min.css";
import "./style.css";

function renderAuditReport(host: HostApplication, kdb: KdbState, theme: ThemeState) {
  const store = initStore(host, kdb, theme);
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "showFullReport":
        window.scrollTo(0, 0);
        store.dispatch(showFullReport(message.report));
        break;
      case "showPartialReport":
        window.scrollTo(0, 0);
        store.dispatch(
          showPartialReport({ report: message.report, ids: message.ids, uri: message.uri })
        );
        break;
      case "showNoReport":
        window.scrollTo(0, 0);
        store.dispatch(showNoReport());
        break;
      case "changeTheme":
        store.dispatch(
          changeTheme({
            kind: message.kind,
            foreground: message.foreground,
            background: message.background,
          })
        );
        break;
    }
  });
}

(window as any).renderAuditReport = renderAuditReport;
