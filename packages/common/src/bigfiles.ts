// export interface CaptureItem {
//   id: string;
//   files: string[];
//   quickgenId: string | undefined;
//   prepareOptions: PrepareOptions;
//   progressStatus: ProgressStatus;
//   pollingCounter: number;
//   log: string[];
//   downloadedFile: string | undefined;
// }

// export type PrepareOptions = {
//   basePath: string;
//   servers: string[];
// };

// export type ProgressStatus = "New" | "Finished" | "In progress" | "Failed";

// export type ShowCaptureWindow = {
//   command: "showCaptureWindow";
//   payload: CaptureItem[];
// };

export type BrowseFile = {
  command: "browseFile";
  payload: undefined;
};

export type ShowBrowseFile = {
  command: "showBrowseFile";
  payload: { file: string };
};

export type Convert = {
  command: "convert";
  payload: { file: string };
};

export type SendFileSegment = {
  command: "sendFileSegment";
  payload: { file: string; textSegment: string; progress: number };
};
