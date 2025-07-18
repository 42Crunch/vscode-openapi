import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CaptureItem, PrepareOptions } from "@xliic/common/capture";
import { set } from "react-hook-form";

export interface CaptureState {
  items: CaptureItem[];
  selectedItemId: string | undefined;
}

const initialState: CaptureState = {
  items: [],
  selectedItemId: undefined,
};

export const slice = createSlice({
  name: "capture",
  initialState,
  reducers: {
    showCaptureWindow: (state, action: PayloadAction<CaptureItem[]>) => {
      state.items = action.payload;
      state.selectedItemId = action.payload.length > 0 ? action.payload[0].id : undefined;
    },
    setSelectedItemId: (state, action: PayloadAction<string>) => {
      state.selectedItemId = action.payload;
    },
    browseFiles: (
      state,
      action: PayloadAction<{ id: string; options: PrepareOptions | undefined }>
    ) => {
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
      item.progressStatus = "In progress";
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
      state.selectedItemId = id;
    },
    downloadFile: (state, action: PayloadAction<{ id: string; quickgenId: string }>) => {
      // -> IDE
    },
    deleteJob: (state, action: PayloadAction<{ id: string; quickgenId: string }>) => {
      let index = -1;
      const id = action.payload.id;
      for (let i = 0; i < state.items.length; i++) {
        if (state.items[i].id === id) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        state.items.splice(index, 1);
      }
      // -> IDE
    },
    openLink: (state, action: PayloadAction<string>) => {
      // -> IDE
    },
  },
});

export const {
  showCaptureWindow,
  browseFiles,
  setPrepareOptions,
  convert,
  saveCapture,
  downloadFile,
  deleteJob,
  openLink,
  setSelectedItemId,
} = slice.actions;
export default slice.reducer;
