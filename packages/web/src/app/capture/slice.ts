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
    // todo: send id everywhere and handle it
    browseFiles: (state, action: PayloadAction<undefined>) => {
      // -> IDE
    },
    browseFilesComplete: (state, action: PayloadAction<FilesList>) => {
      // Always place at first place to avoid sorting during rendering
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
    },
    setPrepareOptions2: (state, action: PayloadAction<PrepareOptions>) => {
      state.items[0].prepareOptions = action.payload;
    },
    prepare: (state, action: PayloadAction<ConvertOptions>) => {
      // -> IDE todo: rename to convert (prepare is just the first part of it)
    },
    showPrepareResponse: (state, action: PayloadAction<PrepareResponse>) => {
      if (action.payload.success) {
        state.items[0].quickgenId = action.payload.quickgenId;
        state.items[0].progressStatus = "In progress";
        state.items[0].log.push("Prepare done");
      } else {
        state.items[0].log.push("Prepare failed: " + action.payload.error);
      }
    },
    showPrepareUploadFileResponse: (state, action: PayloadAction<UploadFileResponse>) => {
      if (action.payload.completed) {
        state.items[0].log.push("All files have been uploaded to the capture server");
      } else {
        const log = state.items[0].log;
        const percent = 100 * action.payload.progress.percent;
        if (log[log.length - 1].startsWith("Uploading selected files")) {
          log[log.length - 1] = "Uploading selected files " + percent + "%";
        } else {
          log.push("Uploading selected files " + percent + "%");
        }
      }
      // todo: handle error
    },
    showExecutionStartResponse: (state, action: PayloadAction<ExecutionStartResponse>) => {
      if (action.payload.success) {
        state.items[0].log.push("Remote execution has been started");
      } else {
        state.items[0].log.push("Start remote execution failed: " + action.payload.message);
      }
    },
    showExecutionStatusResponse: (state, action: PayloadAction<ExecutionStatusResponse>) => {
      if (action.payload.success) {
        const log = state.items[0].log;
        if (log[log.length - 1].startsWith("Current execution status is")) {
          log[log.length - 1] = "Current execution status is " + action.payload.status;
        } else {
          log.push("Current execution status is " + action.payload.status);
        }
        if (action.payload.status === "finished") {
          state.items[0].progressStatus = "Finished";
        } else if (action.payload.status === "failed") {
          state.items[0].progressStatus = "Failed";
        }
      } else {
        state.items[0].log.push("Execution failed: " + action.payload.error);
      }
    },
    downloadResult: (state, action: PayloadAction<QuickGenId>) => {
      // -> IDE
    },
    showDownloadResult: (state, action: PayloadAction<DownloadResultResponse>) => {
      if (action.payload.success) {
        state.items[0].downloadedFile = action.payload.file;
      } else {
        state.items[0].log.push("Download failed: " + action.payload.error);
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
  setPrepareOptions2,
  prepare,
  showPrepareResponse,
  showPrepareUploadFileResponse,
  showExecutionStartResponse,
  showExecutionStatusResponse,
  downloadResult,
  showDownloadResult,
  openLink,
} = slice.actions;
export default slice.reducer;
