import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CaptureItem, PrepareOptions } from "@xliic/common/capture";

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
    browseFiles: (
      state,
      action: PayloadAction<{ id: string; options: PrepareOptions | undefined }>
    ) => {
      // -> IDE
    },
    setPrepareOptions: (state, action: PayloadAction<PrepareOptions & { id: string }>) => {
      const id = action.payload.id;
      if (id) {
        const item = state.items.filter((item) => item.id === id)[0];
        item.prepareOptions = action.payload;
      }
    },
    convert: (
      state,
      action: PayloadAction<{ id: string; files: string[]; options: PrepareOptions }>
    ) => {
      // -> IDE
    },
    saveCapture: (state, action: PayloadAction<CaptureItem>) => {
      const id = action.payload.id;
      if (id) {
        let found = false;
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
      }
    },
    downloadFile: (state, action: PayloadAction<{ id: string; quickgenId: string }>) => {
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
  openLink,
} = slice.actions;
export default slice.reducer;
