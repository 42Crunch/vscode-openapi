import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { webappFilePicker } from "../../core/file-picker/webapp-client";

export interface State {}

const initialState: State = {};

export const slice = createSlice({
  name: "file-picker",
  initialState,
  reducers: {
    selectFile: (
      state,
      action: PayloadAction<{ id: string; title: string; extensions: string[] }>
    ) => {},
  },
});

export const { selectFile } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

// Returns a function that opens a host file dialog and resolves with the picked
// file's base64 content (or undefined if cancelled).
export function useFilePicker() {
  const dispatch = useFeatureDispatch();
  return webappFilePicker((id, title, extensions) => dispatch(selectFile({ id, title, extensions })));
}

export default slice.reducer;
