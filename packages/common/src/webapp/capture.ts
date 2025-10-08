import {
  SelectFiles,
  DownloadFile,
  Convert,
  ShowCaptureWindow,
  SaveCapture,
  DeleteJob,
  SaveCaptureSettings,
} from "../capture";
import { OpenLinkMessage } from "../link";
import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";
import { LoadConfigMessage } from "../config";
import { SendHttpRequestMessage, ShowHttpErrorMessage, ShowHttpResponseMessage } from "../http";
import { ShowGeneralErrorMessage } from "../error";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | LoadConfigMessage
  | ShowCaptureWindow
  | SaveCapture
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | ShowGeneralErrorMessage,
  // produces
  | SelectFiles
  | Convert
  | DownloadFile
  | DeleteJob
  | OpenLinkMessage
  | SaveCaptureSettings
  | SendHttpRequestMessage
>;
