import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";
import { Audit, Kdb } from "../audit";
import { OpenLinkMessage } from "../link";

export type StartAuditMessage = {
  command: "startAudit";
  payload: undefined;
};

export type CancelAuditMessage = {
  command: "cancelAudit";
  payload: undefined;
};

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

export type Webapp = App<
  // consumes
  | StartAuditMessage
  | CancelAuditMessage
  | ShowFullReportMessage
  | ShowPartialReportMessage
  | ShowNoReportMessage
  | LoadKdbMessage
  | ChangeThemeMessage,
  // produces
  GoToLineMessage | CopyIssueIdMessage | OpenLinkMessage
>;
