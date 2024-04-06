import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { GeneralError } from "@xliic/common/error";

export interface State {
  error?: GeneralError;
}

const initialState: State = {};

export const slice = createSlice({
  name: "generalError",
  initialState,
  reducers: {
    showGeneralError: (state, action: PayloadAction<GeneralError>) => {
      state.error = action.payload;
    },
  },
});

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export const { showGeneralError } = slice.actions;
export default slice.reducer;
