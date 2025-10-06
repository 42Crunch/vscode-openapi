export type PrepareOptions = {
  basePath: string;
  servers: string[];
};

export type Status = "pending" | "running" | "finished" | "failed";

export type CaptureItem = {
  id: string;
  files: string[];
  quickgenId: string | undefined;
  prepareOptions: PrepareOptions;
  status: Status;
  pollingCounter: number;
  log: string[];
  downloadedFile: string | undefined;
};

export type CaptureSettings = {
  files: string[];
  prepareOptions: PrepareOptions;
};

export type ShowCaptureWindow = {
  command: "showCaptureWindow";
  payload: {
    token: string;
    items: CaptureItem[];
  };
};

export type SelectFiles = {
  command: "selectFiles";
  payload: { id: string | undefined };
};

export type Convert = {
  command: "convert";
  payload: { id: string };
};

export type SaveCapture = {
  command: "saveCapture";
  payload: CaptureItem;
};

export type SaveCaptureSettings = {
  command: "saveCaptureSettings";
  payload: { id: string; settings: CaptureSettings };
};

export type DownloadFile = {
  command: "downloadFile";
  payload: { id: string };
};

export type DeleteJob = {
  command: "deleteJob";
  payload: { id: string };
};
