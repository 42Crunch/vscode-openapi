import {
  BrowseFiles,
  BrowseFilesComplete,
  DownloadResult,
  Prepare,
  ShowCaptureWindow,
  ShowDownloadResult,
  ShowExecutionStartResponse,
  ShowExecutionStatusResponse,
  ShowPrepareResponse,
  ShowPrepareUploadFileResponse,
} from "../capture";
import { OpenLinkMessage } from "../link";
import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | ShowCaptureWindow
  | BrowseFilesComplete
  | ShowPrepareResponse
  | ShowPrepareUploadFileResponse
  | ShowExecutionStartResponse
  | ShowExecutionStatusResponse
  | ShowDownloadResult,
  // produces
  BrowseFiles | Prepare | DownloadResult | OpenLinkMessage
>;
