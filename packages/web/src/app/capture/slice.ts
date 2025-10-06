import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CaptureItem, Convert, SaveCaptureSettings } from "@xliic/common/capture";

export interface CaptureState {
  items: CaptureItem[];
  selectedId: string | undefined;
  token: string | undefined;
}

const initialState: CaptureState = {
  items: [],
  selectedId: undefined,
  token: undefined,
};

export const slice = createSlice({
  name: "capture",
  initialState,
  reducers: {
    showCaptureWindow: (state, action: PayloadAction<{ items: CaptureItem[]; token: string }>) => {
      state.items = action.payload.items;
      state.selectedId = action.payload.items.length > 0 ? action.payload.items[0].id : undefined;
      state.token = action.payload.token;
    },

    setSelectedItemId: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },

    selectFiles: (state, action: PayloadAction<{ id: string | undefined }>) => {
      // -> IDE
    },

    convert: (state, action: PayloadAction<Convert["payload"]>) => {
      const id = action.payload.id;
      const item = state.items.filter((item) => item.id === id)[0];
      item.status = "running";
      item.log = [];
      item.downloadedFile = undefined;
      // -> IDE
    },

    saveCapture: (state, action: PayloadAction<CaptureItem>) => {
      const id = state.items.findIndex((item) => item.id === action.payload.id);
      action.payload.files.sort();
      if (id !== -1) {
        state.items[id] = action.payload;
      } else {
        state.items.unshift(action.payload);
        state.selectedId = action.payload.id;
      }
    },

    saveCaptureSettings: (state, action: PayloadAction<SaveCaptureSettings["payload"]>) => {
      const { id, settings } = action.payload;
      const item = state.items.findIndex((item) => item.id === id);
      if (item !== -1) {
        state.items[item].prepareOptions = settings.prepareOptions;
      }
    },

    downloadFile: (state, action: PayloadAction<{ id: string }>) => {
      // -> IDE
    },

    deleteJob: (state, { payload: { id } }: PayloadAction<{ id: string }>) => {
      state.items = state.items.filter((item) => item.id !== id);
      state.selectedId = state.items[0]?.id;
    },

    deleteFile: (state, action: PayloadAction<{ id: string; file: string }>) => {
      const { id, file } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item) {
        item.files = item.files.filter((f) => f !== file);
      }
    },

    openLink: (state, action: PayloadAction<string>) => {
      // -> IDE
    },
  },
});

export const {
  showCaptureWindow,
  selectFiles,
  saveCaptureSettings,
  convert,
  saveCapture,
  downloadFile,
  deleteJob,
  deleteFile,
  openLink,
  setSelectedItemId,
} = slice.actions;
export default slice.reducer;
