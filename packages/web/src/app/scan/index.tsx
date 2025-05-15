import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/scan";
import { makeWebappMessageHandler } from "../webapp";

import { createListener, perPage } from "./listener";
import { initStore, useAppDispatch, useAppSelector } from "./store";

import Router from "../../features/router/Router";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";

import {
  closeInitDb,
  parseChunk,
  scanOperation,
  showFullScanReport,
  showFullScanReport2,
  showGeneralError,
  showHttpError,
  showHttpResponse,
  showScanReport,
  startInitDb,
  startScan,
} from "./slice";

import { loadConfig } from "../../features/config/slice";
import { loadEnv } from "../../features/env/slice";
import { showLogMessage } from "../../features/logging/slice";
import { loadPrefs } from "../../features/prefs/slice";

import { PaginationResponse } from "../../json-streaming-parser/models/pagination.model";
import { getScanv2Db } from "../../json-streaming-parser/scanv2-processor";
import Paginator from "./Paginator";
import ScanOperation from "./ScanOperation";
import ProgressBar from "../config/ProgressBar";

const routes: Routes = [
  {
    id: "starting",
    title: "",
    navigation: false,
    element: <div />,
  },
  {
    id: "scan",
    title: "Scan",
    element: <ScanOperation />,
    when: startScan,
  },
];

const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  startScan,
  scanOperation,
  showGeneralError,
  showHttpError,
  showHttpResponse,
  showScanReport,
  showFullScanReport,
  loadEnv,
  loadPrefs,
  loadConfig,
  showLogMessage,
  closeInitDb,
  startInitDb,
  parseChunk,
};

function App() {
  const dispatch = useAppDispatch();
  const { totalItems, pageIndex, progress } = useAppSelector((state) => state.scan);
  //const [dbTimeDelta, setDbTimeDelta] = useState<number>(0);

  return (
    <>
      {progress !== 1 && <ProgressBar label="" progress={progress} />}
      {totalItems > 0 && (
        <Paginator
          totalItems={totalItems}
          itemsPerPage={perPage}
          onPageChange={(pageIndex) => {
            console.info("pageIndex = " + pageIndex);
            const dbService = getScanv2Db();
            dbService.getReport().then((report) => {
              const start = new Date().getTime();
              dbService.getIssues(pageIndex, perPage).then((resp: PaginationResponse) => {
                const end = new Date().getTime();
                console.info("### db delay " + (end - start) / 1000 + ", perPage = " + perPage);
                dispatch(showFullScanReport2({ pageIndex, issues: resp.list, report }));
              });
            });
          }}
        />
      )}
      <ThemeStyles />
      <Router />
    </>
  );

  // return (
  //   <>
  //     {chunkId >= 0 && <div>{"chunks = " + (chunkId + 1)}</div>}
  //     {chunkSize && <div>{"chunkSize = " + chunkSize / 1024 + " KB"}</div>}
  //     {issues && <div>{"issues  = " + issues.length}</div>}
  //     {progress === 1.0 && timeDelta > 0 && (
  //       <div>{"timeDelta  = " + timeDelta / 1000 + " seconds"}</div>
  //     )}
  //     {/* {issues.length > 0 && <ScanIssuesV2 issues={issues} />} */}
  //     <ThemeStyles />
  //     <Router />
  //   </>
  // );
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
