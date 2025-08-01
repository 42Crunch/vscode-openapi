import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CaptureItem, PrepareOptions } from "@xliic/common/capture";

export interface CaptureState {
  items: CaptureItem[];
  selectedItem: CaptureItem | undefined;
}

const initialState: CaptureState = {
  items: [],
  selectedItem: undefined,
};

export const slice = createSlice({
  name: "capture",
  initialState,
  reducers: {
    showCaptureWindow: (state, action: PayloadAction<CaptureItem[]>) => {
      state.items = action.payload;
      state.selectedItem = action.payload.length > 0 ? action.payload[0] : undefined;
    },
    setSelectedItemId: (state, action: PayloadAction<string>) => {
      state.selectedItem = state.items.find((item) => item.id === action.payload);
    },
    selectFiles: (state, action: PayloadAction<{ id: string | undefined }>) => {
      // -> IDE
    },
    setPrepareOptions: (state, action: PayloadAction<PrepareOptions & { id: string }>) => {
      const id = action.payload.id;
      const item = state.items.filter((item) => item.id === id)[0];
      item.prepareOptions = action.payload;
    },
    convert: (
      state,
      action: PayloadAction<{ id: string; files: string[]; options: PrepareOptions }>
    ) => {
      const id = action.payload.id;
      const item = state.items.filter((item) => item.id === id)[0];
      item.status = "running";
      item.log = [];
      item.downloadedFile = undefined;
      // -> IDE
    },
    saveCapture: (state, action: PayloadAction<CaptureItem>) => {
      let found = false;
      const id = action.payload.id;
      for (let i = 0; i < state.items.length; i++) {
        if (state.items[i].id === id) {
          state.items[i] = action.payload;
          found = true;
          break;
        }
      }
      if (!found) {
        state.items.unshift(action.payload);
      }
      state.selectedItem = state.items.find((item) => item.id === id);
    },
    downloadFile: (state, action: PayloadAction<{ id: string }>) => {
      // -> IDE
    },
    deleteJob: (state, { payload: { id } }: PayloadAction<{ id: string }>) => {
      state.items = state.items.filter((item) => item.id !== id);
      state.selectedItem = state.items[0];
    },
    openLink: (state, action: PayloadAction<string>) => {
      // -> IDE
    },
  },
});

export const {
  showCaptureWindow,
  selectFiles,
  setPrepareOptions,
  convert,
  saveCapture,
  downloadFile,
  deleteJob,
  openLink,
  setSelectedItemId,
} = slice.actions;
export default slice.reducer;
