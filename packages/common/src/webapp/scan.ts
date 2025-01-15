import { Webapp as App } from "../message";
import {
  ScanOperationMessage,
  ShowScanReportMessage,
  ShowJsonPointerMessage,
  StartScanMessage,
  ShowFullScanReportMessage,
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
import { ShowLogMessage } from "../logging";

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
  | ShowFullScanReportMessage
  | ShowHttpResponseMessage
  | ShowLogMessage,
  // produces
  | ShowEnvWindow
  | SavePreferencesMessage
  | SendHttpRequestMessage
  | SendCurlRequestMessage
  | ShowJsonPointerMessage
>;
