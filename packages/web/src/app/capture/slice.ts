import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CaptureItem,
  ConvertOptions,
  DownloadResultResponse,
  ExecutionStartResponse,
  ExecutionStatusResponse,
  FilesList,
  PrepareOptions,
  PrepareResponse,
  QuickGenId,
  Status,
  UploadFileResponse,
} from "@xliic/common/capture";
import { useId } from "react";

export interface CaptureState {
  items: CaptureItem[];
}

const initialState: CaptureState = {
  items: [],
};

export const slice = createSlice({
  name: "capture",
  initialState,
  reducers: {
    showCaptureWindow: (state, action: PayloadAction<CaptureItem[]>) => {
      state.items = action.payload;
    },
    browseFiles: (state, action: PayloadAction<string>) => {
      // -> IDE
    },
    browseFilesComplete: (state, action: PayloadAction<FilesList>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        item.files = action.payload.files;
      } else {
        state.items.unshift({
          id: crypto.randomUUID(),
          files: action.payload.files,
          quickgenId: undefined,
          prepareOptions: {
            basePath: "",
            servers: [],
          },
          progressStatus: "New",
          log: [],
          downloadedFile: undefined,
        });
      }
    },
    setPrepareOptions: (state, action: PayloadAction<PrepareOptions & { id: string }>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        item.prepareOptions = action.payload;
      }
    },
    convert: (state, action: PayloadAction<ConvertOptions>) => {
      // -> IDE
    },
    showPrepareResponse: (state, action: PayloadAction<PrepareResponse>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        if (action.payload.success) {
          item.quickgenId = action.payload.quickgenId;
          item.progressStatus = "In progress";
          item.log.push("Prepare done");
        } else {
          item.log.push("Prepare failed: " + action.payload.error);
        }
      }
    },
    showPrepareUploadFileResponse: (state, action: PayloadAction<UploadFileResponse>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        if (action.payload.completed) {
          item.log.push("All files have been uploaded to the capture server");
        } else {
          const log = item.log;
          const percent = 100 * action.payload.progress.percent;
          if (log[log.length - 1].startsWith("Uploading selected files")) {
            log[log.length - 1] = "Uploading selected files " + percent + "%";
          } else {
            log.push("Uploading selected files " + percent + "%");
          }
        }
        // todo: handle error
      }
    },
    showExecutionStartResponse: (state, action: PayloadAction<ExecutionStartResponse>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        if (action.payload.success) {
          item.log.push("Remote execution has been started");
        } else {
          item.log.push("Start remote execution failed: " + action.payload.message);
        }
      }
    },
    showExecutionStatusResponse: (state, action: PayloadAction<ExecutionStatusResponse>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        if (action.payload.success) {
          const log = item.log;
          if (log[log.length - 1].startsWith("Current execution status is")) {
            log[log.length - 1] = "Current execution status is " + action.payload.status;
          } else {
            log.push("Current execution status is " + action.payload.status);
          }
          if (action.payload.status === "finished") {
            item.progressStatus = "Finished";
          } else if (action.payload.status === "failed") {
            item.progressStatus = "Failed";
          }
        } else {
          item.log.push("Execution failed: " + action.payload.error);
        }
      }
    },
    downloadResult: (state, action: PayloadAction<QuickGenId & { id: string }>) => {
      // -> IDE
    },
    showDownloadResult: (state, action: PayloadAction<DownloadResultResponse>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        if (action.payload.success) {
          item.downloadedFile = action.payload.file;
        } else {
          item.log.push("Download failed: " + action.payload.error);
        }
      }
    },
    openLink: (state, action: PayloadAction<string>) => {
      // -> IDE
    },
  },
});

export const {
  showCaptureWindow,
  browseFiles,
  browseFilesComplete,
  setPrepareOptions,
  convert,
  showPrepareResponse,
  showPrepareUploadFileResponse,
  showExecutionStartResponse,
  showExecutionStatusResponse,
  downloadResult,
  showDownloadResult,
  openLink,
} = slice.actions;
export default slice.reducer;
