import { Webapp as App } from "../message";
import { ShowScanReportMessage, ShowJsonPointerMessage, ShowFullScanReportMessage } from "../scan";
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
import { ParseChunkMessage, ParseChunkCompletedMessage } from "../index-db";

export type Webapp = App<
  // consumes
  | ShowGeneralErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | LoadConfigMessage
  | ChangeThemeMessage
  | ShowScanReportMessage
  | ShowFullScanReportMessage
  | ShowLogMessage
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | ParseChunkMessage,
  // produces
  | ShowEnvWindow
  | SavePreferencesMessage
  | SendHttpRequestMessage
  | SendCurlRequestMessage
  | ShowJsonPointerMessage
  | ParseChunkCompletedMessage
>;
