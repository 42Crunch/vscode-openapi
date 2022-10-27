import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";
import { Audit, Kdb } from "../audit";

type ShowFullReportMessage = {
  command: "showFullReport";
  payload: Audit;
};

type ShowPartialReportMessage = {
  command: "showPartialReport";
  payload: { report: Audit; uri: string; ids: any[] };
};

type ShowNoReportMessage = {
  command: "showNoReport";
  payload: void;
};

type LoadKdbMessage = {
  command: "loadKdb";
  payload: Kdb;
};

type GoToLineMessage = {
  command: "goToLine";
  payload: { uri: string; line: number; pointer: string };
};

type CopyIssueIdMessage = {
  command: "copyIssueId";
  payload: string;
};

type OpenLinkMessage = {
  command: "openLink";
  payload: string;
};

export type Webapp = App<
  // consumes
  | ShowFullReportMessage
  | ShowPartialReportMessage
  | ShowNoReportMessage
  | LoadKdbMessage
  | ChangeThemeMessage,
  // produces
  GoToLineMessage | CopyIssueIdMessage | OpenLinkMessage
>;
