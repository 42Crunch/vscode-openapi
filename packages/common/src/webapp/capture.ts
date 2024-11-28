import {
  BrowseFiles,
  BrowseFilesComplete,
  DownloadResult,
  ExecutionStart,
  ExecutionStatus,
  Prepare,
  PrepareUploadFile,
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
  | BrowseFiles
  | Prepare
  | PrepareUploadFile
  | ExecutionStart
  | ExecutionStatus
  | DownloadResult
  | OpenLinkMessage
>;
