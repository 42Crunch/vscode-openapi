import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { Webapp } from "@xliic/common/webapp/scan";
import { makeWebappMessageHandler } from "../webapp";

import { createListener } from "./listener";
import { initStore, useAppDispatch, useAppSelector } from "./store";

import Router from "../../features/router/Router";
import { RouterContext, Routes } from "../../features/router/RouterContext";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState, changeTheme } from "../../features/theme/slice";

import {
  closeInitDb,
  parseChunk,
  scanOperation,
  sendInitDbComplete,
  sendParseChunkComplete,
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

import { getScanv2Db } from "../../json-streaming-parser/scanv2-processor";
import { initProcessReport, processReport } from "../../json-streaming-parser/worker";
import ScanOperation from "./ScanOperation";
import { PaginationResponse } from "../../json-streaming-parser/models/pagination.model";
import Paginator from "./Paginator";

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
  const { initDbStarted, chunkId, chunkText, progress } = useAppSelector((state) => state.scan);

  //const [dbTimeDelta, setDbTimeDelta] = useState<number>(0);

  const [timeDelta, setTimeDelta] = useState<number>(0);
  const [chunkSize, setChunkSize] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(-1);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (initDbStarted) {
      dispatch(startScan(undefined));
      initProcessReport("vscode.scan.v2.db")
        .then(() => {
          dispatch(sendInitDbComplete({ status: true, message: "" }));
        })
        .catch((e: any) => {
          dispatch(
            sendInitDbComplete({
              status: false,
              message: `Failed to connect to the database: ${e.message}`,
            })
          );
        });
    }
  }, [initDbStarted]);

  const perPage = 50;

  useEffect(() => {
    if (chunkId >= 0) {
      console.info("chunkId = " + chunkId + ", progress = " + progress);
      if (chunkId === 0) {
        // first chunk
        setChunkSize(chunkText.length);
        setTimeDelta(new Date().getTime());
      }
      processReport(progress === 1.0, chunkText).then(() => {
        dispatch(sendParseChunkComplete({ id: chunkId }));
        if (progress === 1.0) {
          setTimeDelta(new Date().getTime() - timeDelta);
          const dbService = getScanv2Db();
          // dbService.getIssuesList().then((issues) => {
          //   dbService.getReport().then((report) => {
          //     dispatch(showFullScanReport2({ issues, report }));
          //   });
          // });

          dbService.getReport().then((report) => {
            const start = new Date().getTime();
            //dbService.getIssues(page, perPage).then((resp: PaginationResponse) => {
            dbService.getIssuesList().then((issues: any[]) => {
              const end = new Date().getTime();
              console.info("### db delay " + (end - start) / 1000 + ", issues = " + issues.length);
              //setTotalItems(resp.filteredItems);
              //dispatch(showFullScanReport2({ issues, report }));
            });

            const start2 = new Date().getTime();
            dbService.getOperationsList().then((ops: any[]) => {
              const end2 = new Date().getTime();
              console.info("### db delay " + (end2 - start2) / 1000 + ", ops = " + ops.length);
              //setTotalItems(resp.filteredItems);
              //dispatch(showFullScanReport2({ issues: ops, report }));
            });
          });
        }
      });
    }
  }, [chunkId]);

  return (
    <>
      {chunkSize && <div>{"chunkSize = " + chunkSize / 1024 + " KB"}</div>}
      {progress === 1.0 && timeDelta > 0 && (
        <div>{"timeDelta  = " + timeDelta / 1000 + " seconds"}</div>
      )}
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
                dispatch(showFullScanReport2({ issues: resp.list, report }));
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
