import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { HttpConfig, HttpRequest } from "@xliic/common/http";

export interface State {}

const initialState: State = {};

export const slice = createSlice({
  name: "http-client",
  initialState,
  reducers: {
    sendHttpRequest: (
      state,
      action: PayloadAction<{ id: string; request: HttpRequest; config: HttpConfig }>
    ) => {},
  },
});

export const { sendHttpRequest } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
