import { Webapp as App } from "../message";
import {
  RunScanMessage,
  ScanOperationMessage,
  ShowScanReportMessage,
  ShowJsonPointerMessage,
  ShowAuditReportMessage,
  StartScanMessage,
} from "../scan";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";
import { LoadEnvMessage, ShowEnvWindow } from "../env";
import { ChangeThemeMessage } from "../theme";
import { ShowGeneralErrorMessage } from "../error";
import {
  SendHttpRequestMessage,
  SendCurlRequestMessage,
  ShowHttpResponseMessage,
  ShowHttpErrorMessage,
} from "../http";
import { LoadConfigMessage } from "../config";

export type Webapp = App<
  // consumes
  | StartScanMessage
  | ScanOperationMessage
  | ShowGeneralErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | LoadConfigMessage
  | ChangeThemeMessage
  | ShowHttpErrorMessage
  | ShowScanReportMessage
  | ShowHttpResponseMessage,
  // produces
  | RunScanMessage
  | ShowEnvWindow
  | SavePreferencesMessage
  | SendHttpRequestMessage
  | SendCurlRequestMessage
  | ShowJsonPointerMessage
  | ShowAuditReportMessage
>;
