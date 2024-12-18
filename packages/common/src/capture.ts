export interface CaptureItem {
  id: string;
  files: string[];
  quickgenId: string | undefined;
  prepareOptions: PrepareOptions;
  progressStatus: ProgressStatus;
  log: string[];
  downloadedFile: string | undefined;
}

export type ProgressStatus = "New" | "Finished" | "In progress" | "Failed";

export type ResponseError = { id: string; success: false; error: string };

// Initial message to show capture web app
export type ShowCaptureWindow = {
  command: "showCaptureWindow";
  payload: CaptureItem[];
};

// Messages to select HAR/Postman files input
export type BrowseFiles = {
  command: "browseFiles";
  payload: string;
};

export type BrowseFilesComplete = {
  command: "browseFilesComplete";
  payload: FilesList;
};

export type FilesList = {
  id: string;
  files: string[];
};

// Main message to start converting
export type ConvertOptions = FilesList & {
  options: PrepareOptions;
};

export type Convert = {
  command: "convert";
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

export type PrepareResponse = { id: string; success: true; quickgenId: string } | ResponseError;

export type ShowPrepareUploadFileResponse = {
  command: "showPrepareUploadFileResponse";
  payload: UploadFileResponse;
};

export type UploadFileResponse =
  | { id: string; completed: false; progress: UploadFileProgress }
  | { id: string; completed: true; success: true }
  | { id: string; completed: true; success: false; error: string };

export type UploadFileProgress = {
  percent: number; // 0 <= value <= 1
};

export type ShowExecutionStartResponse = {
  command: "showExecutionStartResponse";
  payload: ExecutionStartResponse;
};

export type QuickGenId = { quickgenId: string };
export type ExecutionStartResponse = { id: string; success: boolean; message: string };

export type ShowExecutionStatusResponse = {
  command: "showExecutionStatusResponse";
  payload: ExecutionStatusResponse;
};

export type Status = "pending" | "running" | "finished" | "failed";
export type ExecutionStatusResponse =
  | { id: string; success: true; status: Status; message: string }
  | ResponseError;

// Download openapi file
export type DownloadResult = {
  command: "downloadResult";
  payload: QuickGenId & { id: string };
};

export type ShowDownloadResult = {
  command: "showDownloadResult";
  payload: DownloadResultResponse;
};

export type DownloadResultResponse = { id: string; success: true; file: string } | ResponseError;
