import React from "react";
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
  showFullScanReport,
  showFullScanReport2,
  showGeneralError,
  showHttpError,
  showHttpResponse,
  showIssuesTable,
  showScanReport,
  startInitDb,
  startScan,
  TestLogReportWithLocation,
} from "./slice";

import { loadConfig } from "../../features/config/slice";
import { loadEnv } from "../../features/env/slice";
import { showLogMessage } from "../../features/logging/slice";
import { loadPrefs } from "../../features/prefs/slice";

import { getScanv2Db } from "../../json-streaming-parser/scanv2-processor";
import Paginator from "./Paginator";
import ScanOperation from "./ScanOperation";
import ProgressBar from "../config/ProgressBar";
import { ParserFieldSortOrder } from "../../json-streaming-parser/types";
import { issuesPerPage, Table, TableColumn } from "./table";

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
  const { issues, totalItems } = useAppSelector((state) => state.scan);

  const columns: TableColumn<TestLogReportWithLocation>[] = [
    { header: "Method", accessor: "method", sortable: false },
    { header: "Path", accessor: "path", sortable: true },
    {
      header: "Criticality",
      accessor: "outcome",
      render: (value) => <span className={`criticality`}>{value.criticality}</span>,
      sortable: true,
    },
    {
      header: "Status",
      accessor: "outcome",
      render: (value) => <span className={`status`}>{value.status}</span>,
      sortable: false,
    },
    {
      header: "Key",
      accessor: "test",
      render: (value) => <span className={`testKey`}>{value.key}</span>,
      sortable: false,
    },
    {
      header: "Description",
      accessor: "test",
      render: (value) => <span className={`testDescription`}>{value.description}</span>,
      sortable: false,
    },
  ];

  const onPageChange = (page: number, pageSize: number, filter: ParserFieldSortOrder) => {
    const dbService = getScanv2Db();
    dbService.getIssues(page, pageSize, filter).then((resp: any) => {
      dispatch(
        showIssuesTable({
          totalItems: resp.filteredItems,
          issues: resp.list,
        })
      );
    });
  };

  return (
    <div className="app">
      <Table
        data={issues}
        size={totalItems}
        columns={columns}
        onPageChange={onPageChange}
        pageSize={issuesPerPage}
        defaultSort={{ key: "path", direction: "asc" }}
      />
    </div>
  );

  // return (
  //   <>
  //     {progress !== 1 && <ProgressBar label="" progress={progress} />}
  //     {totalItems > 0 && (
  //       <Paginator
  //         totalItems={totalItems}
  //         itemsPerPage={perPage}
  //         onPageChange={(pageIndex) => {
  //           console.info("pageIndex = " + pageIndex);
  //           const dbService = getScanv2Db();
  //           dbService.getReport().then((report) => {
  //             const start = new Date().getTime();
  //             dbService
  //               .getIssues(pageIndex, perPage, new ParserFieldSortOrder("path"))
  //               .then((resp: any) => {
  //                 const end = new Date().getTime();
  //                 console.info("### db delay " + (end - start) / 1000 + ", perPage = " + perPage);
  //                 dispatch(showFullScanReport2({ pageIndex, issues: resp.list, report }));
  //               });
  //           });
  //         }}
  //       />
  //     )}
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
