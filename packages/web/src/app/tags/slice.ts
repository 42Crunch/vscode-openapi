import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { HttpRequest, HttpResponse, HttpError, HttpConfig } from "@xliic/common/http";
import { TagData } from "@xliic/common/tags";

import { Category } from "../../features/http-client/platform-api";

export interface TagsState {
  targetFileName: string;
  tagData: TagData | undefined; // Data from IDE memento
  categories: Category[];
}

const initialState: TagsState = {
  targetFileName: "",
  tagData: undefined,
  categories: [],
};

export const slice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    loadTags: (
      state,
      action: PayloadAction<{
        targetFileName: string;
        data: TagData;
      }>
    ) => {
      state.targetFileName = action.payload.targetFileName;
      state.tagData = action.payload.data;
    },
    saveTagsInStateOnly: (state, action: PayloadAction<TagData>) => {
      if (state.tagData) {
        state.tagData[state.targetFileName] = action.payload[state.targetFileName];
      }
    },
    saveTags: (state, action: PayloadAction<TagData>) => {
      // hook for a listener
      if (state.tagData) {
        state.tagData[state.targetFileName] = action.payload[state.targetFileName];
      }
    },
    sendHttpRequest: (
      state,
      action: PayloadAction<{
        id: string;
        request: HttpRequest;
        config: HttpConfig;
      }>
    ) => {
      // hook for a listener
    },
    showHttpResponse: (state, action: PayloadAction<{ id: string; response: HttpResponse }>) => {},
    showHttpError: (state, action: PayloadAction<{ id: string; error: HttpError }>) => {},
  },
});

export const {
  loadTags,
  saveTagsInStateOnly,
  saveTags,
  sendHttpRequest,
  showHttpResponse,
  showHttpError,
} = slice.actions;

export default slice.reducer;
