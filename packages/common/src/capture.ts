export interface CaptureItem {
  id: string;
  files: string[];
  quickgenId: string | undefined;
  prepareOptions: PrepareOptions;
  progressStatus: ProgressStatus;
  log: string[];
  downloadedFile: string | undefined;
}

// Status New is never shown and used only for internal needs
export type ProgressStatus = "New" | "Finished" | "In progress" | "Failed";

export type ResponseError = { success: false; error: string };

// Initial message to show capture web app
export type ShowCaptureWindow = {
  command: "showCaptureWindow";
  payload: CaptureItem[];
};

// Messages to select HAR/Postman files input
export type BrowseFiles = {
  command: "browseFiles";
  payload: undefined;
};

export type BrowseFilesComplete = {
  command: "browseFilesComplete";
  payload: FilesList;
};

export type FilesList = {
  files: string[];
};

// Prepare (called if convert button is pushed)
export type ConvertOptions = FilesList & {
  options: PrepareOptions;
};

export type Prepare = {
  command: "prepare"; // todo: rename to convert later because it is not only preparing now
  payload: ConvertOptions;
};

export type ShowPrepareResponse = {
  command: "showPrepareResponse";
  payload: PrepareResponse;
};

export type PrepareOptions = {
  basePath: string;
  servers: string[];
};

export type PrepareResponse = { success: true; quickgenId: string } | ResponseError;

// Upload File (called after web app gets quickgenId)
export type PrepareUploadFile = {
  command: "prepareUploadFile";
  payload: QuickGenId & FilesList;
};

export type ShowPrepareUploadFileResponse = {
  command: "showPrepareUploadFileResponse";
  payload: UploadFileResponse;
};

export type UploadFileResponse =
  | { completed: false; progress: UploadFileProgress }
  | { completed: true; success: true }
  | { completed: true; success: false; error: string };

export type UploadFileProgress = {
  percent: number; // 0 <= value <= 1
};

// Start (called after web app gets upload file success = true response)
export type ExecutionStart = {
  command: "executionStart";
  payload: QuickGenId;
};

export type ShowExecutionStartResponse = {
  command: "showExecutionStartResponse";
  payload: ExecutionStartResponse;
};

export type QuickGenId = { quickgenId: string };
export type ExecutionStartResponse = { success: boolean; message: string };

// Status (called periodically after web app has been successfully started)
export type ExecutionStatus = {
  command: "executionStatus";
  payload: QuickGenId;
};

export type ShowExecutionStatusResponse = {
  command: "showExecutionStatusResponse";
  payload: ExecutionStatusResponse;
};

export type Status = "pending" | "running" | "finished" | "failed";
export type ExecutionStatusResponse =
  | { success: true; status: Status; message: string }
  | ResponseError;

// Download results openapi (called if execution status = finished)
export type DownloadResult = {
  command: "downloadResult";
  payload: QuickGenId; // todo: add default uri to save to?
};

export type ShowDownloadResult = {
  command: "showDownloadResult";
  payload: DownloadResultResponse;
};

export type DownloadResultResponse = { success: true; file: string } | ResponseError;
