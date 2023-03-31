import { Webapp as App } from "../message";
import {
  RunScanMessage,
  ScanOperationMessage,
  ShowScanReportMessage,
  ShowJsonPointerMessage,
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
import { SetDocumentUrlMessage } from "../document";

export type Webapp = App<
  // consumes
  | ScanOperationMessage
  | ShowGeneralErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | ChangeThemeMessage
  | ShowHttpErrorMessage
  | ShowScanReportMessage
  | ShowHttpResponseMessage
  | SetDocumentUrlMessage,
  // produces
  | RunScanMessage
  | ShowEnvWindow
  | SavePreferencesMessage
  | SendHttpRequestMessage
  | SendCurlRequestMessage
  | ShowJsonPointerMessage
>;
