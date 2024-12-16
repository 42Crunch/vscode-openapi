import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CaptureItem,
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

export interface CaptureState {
  items: CaptureItem[];
  files: string[];
  quickgenId: string | undefined;
  prepareRespError: string | undefined;
  prepareUploadFileInProgress: boolean;
  prepareUploadFileProgress: number;
  prepareUploadFileRespError: string | undefined;
  startInProgress: boolean;
  startComplete: boolean;
  startRespError: string | undefined;
  status: Status | undefined;
  statusInProgress: boolean;
  statusPoolingCounter: number;
  statusRespError: string | undefined;
  downloadComplete: boolean;
  downloadedFile: string | undefined;
  downloadRespError: string | undefined;
}

const initialState: CaptureState = {
  items: [],
  files: [],
  quickgenId: undefined,
  prepareRespError: undefined,
  prepareUploadFileInProgress: false,
  prepareUploadFileProgress: 0,
  prepareUploadFileRespError: undefined,
  startInProgress: false,
  startComplete: false,
  startRespError: undefined,
  status: undefined,
  statusInProgress: false,
  statusPoolingCounter: 0,
  statusRespError: undefined,
  downloadComplete: false,
  downloadedFile: undefined,
  downloadRespError: undefined,
};

export const slice = createSlice({
  name: "capture",
  initialState,
  reducers: {
    showCaptureWindow: (state, action: PayloadAction<CaptureItem[]>) => {
      state.items = action.payload;
    },
    browseFiles: (state, action: PayloadAction<undefined>) => {
      // -> IDE
    },
    browseFilesComplete: (state, action: PayloadAction<FilesList>) => {
      state.files = action.payload.files;
    },
    prepare: (state, action: PayloadAction<PrepareOptions>) => {
      // -> IDE
    },
    showPrepareResponse: (state, action: PayloadAction<PrepareResponse>) => {
      if (action.payload.success) {
        state.quickgenId = action.payload.quickgenId;
        state.prepareRespError = undefined;
      } else {
        state.quickgenId = undefined;
        state.prepareRespError = action.payload.error;
      }
    },
    prepareUploadFile: (state, action: PayloadAction<QuickGenId & FilesList>) => {
      // -> IDE
      state.prepareUploadFileInProgress = true;
    },
    showPrepareUploadFileResponse: (state, action: PayloadAction<UploadFileResponse>) => {
      if (action.payload.completed) {
        state.prepareUploadFileInProgress = false;
        state.prepareUploadFileProgress = 1;
      } else {
        state.prepareUploadFileProgress = action.payload.progress.percent;
      }
      // todo: handle error
    },
    executionStart: (state, action: PayloadAction<QuickGenId>) => {
      // -> IDE
      state.startInProgress = true;
      state.startComplete = false;
    },
    showExecutionStartResponse: (state, action: PayloadAction<ExecutionStartResponse>) => {
      state.startInProgress = false;
      if (action.payload.success) {
        state.startComplete = true;
      } else {
        state.startRespError = action.payload.message;
      }
    },
    executionStatus: (state, action: PayloadAction<QuickGenId>) => {
      // -> IDE
      state.statusInProgress = true;
      state.statusRespError = undefined;
    },
    showExecutionStatusResponse: (state, action: PayloadAction<ExecutionStatusResponse>) => {
      if (action.payload.success) {
        state.status = action.payload.status;
        if (state.status === "finished" || state.status === "failed") {
          state.statusInProgress = false;
          state.statusRespError = undefined;
        } else {
          state.statusPoolingCounter += 1;
        }
      } else {
        state.statusInProgress = false;
        state.statusRespError = action.payload.error;
      }
    },
    downloadResult: (state, action: PayloadAction<QuickGenId>) => {
      // -> IDE
      state.downloadComplete = false;
    },
    showDownloadResult: (state, action: PayloadAction<DownloadResultResponse>) => {
      if (action.payload.success) {
        state.downloadedFile = action.payload.file;
      } else {
        state.downloadRespError = action.payload.error;
      }
      state.downloadComplete = true;
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
  prepare,
  showPrepareResponse,
  prepareUploadFile,
  showPrepareUploadFileResponse,
  executionStart,
  showExecutionStartResponse,
  executionStatus,
  showExecutionStatusResponse,
  downloadResult,
  showDownloadResult,
  openLink,
} = slice.actions;
export default slice.reducer;
