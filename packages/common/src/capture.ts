export interface CaptureItem {
  id: string;
  files: string[];
  quickgenId: string | undefined;
  prepareOptions: PrepareOptions;
  progressStatus: ProgressStatus;
  pollingCounter: number;
  log: string[];
  downloadedFile: string | undefined;
}

export type PrepareOptions = {
  basePath: string;
  servers: string[];
};

export type ProgressStatus = "New" | "Finished" | "In progress" | "Failed";

export type ShowCaptureWindow = {
  command: "showCaptureWindow";
  payload: CaptureItem[];
};

export type BrowseFiles = {
  command: "browseFiles";
  payload: { id: string; options: PrepareOptions | undefined };
};

export type Convert = {
  command: "convert";
  payload: { id: string; files: string[]; options: PrepareOptions };
};

export type SaveCapture = {
  command: "saveCapture";
  payload: CaptureItem;
};

export type DownloadFile = {
  command: "downloadFile";
  payload: { id: string; quickgenId: string };
};

export type DeleteJob = {
  command: "deleteJob";
  payload: { id: string; quickgenId: string };
};
