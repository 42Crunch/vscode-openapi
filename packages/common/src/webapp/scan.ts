import { Webapp as App, StartedMessage } from "../message";
import { ShowScanReportMessage, ShowJsonPointerMessage, ShowFullScanReportMessage } from "../scan";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";
import { LoadEnvMessage, ShowEnvWindow } from "../env";
import { ChangeThemeMessage } from "../theme";
import { ShowGeneralErrorMessage } from "../error";
import { SendCurlRequestMessage } from "../http";
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
  | ParseChunkMessage,
  // produces
  | StartedMessage
  | ShowEnvWindow
  | SavePreferencesMessage
  | SendCurlRequestMessage
  | ShowJsonPointerMessage
  | ParseChunkCompletedMessage
>;
