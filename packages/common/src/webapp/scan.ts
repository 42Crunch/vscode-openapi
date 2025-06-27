import { Webapp as App, StartedMessage } from "../message";
import { ShowScanReportMessage, ShowJsonPointerMessage } from "../scan";
import { ChangeThemeMessage } from "../theme";
import { ShowGeneralErrorMessage } from "../error";
import { SendCurlRequestMessage } from "../http";
import { LoadConfigMessage } from "../config";
import { ShowLogMessage } from "../logging";
import { ParseChunkMessage, ParseChunkCompletedMessage } from "../index-db";

export type Webapp = App<
  // consumes
  | ShowGeneralErrorMessage
  | LoadConfigMessage
  | ChangeThemeMessage
  | ShowScanReportMessage
  | ShowLogMessage
  | ParseChunkMessage,
  // produces
  StartedMessage | SendCurlRequestMessage | ShowJsonPointerMessage | ParseChunkCompletedMessage
>;
