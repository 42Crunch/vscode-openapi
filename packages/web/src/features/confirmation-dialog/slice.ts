import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export type State = {
  open: boolean;
  title: string;
  message: string;
  actions: PayloadAction<unknown>[];
};

const initialState: State = {
  open: false,
  title: "",
  message: "",
  actions: [],
};

export const slice = createSlice({
  name: "confirmationDialog",
  initialState,
  reducers: {
    requestConfirmation: (
      state,
      {
        payload: { title, message, actions },
      }: PayloadAction<Pick<State, "message" | "title" | "actions">>
    ) => {
      state.open = true;
      state.message = message;
      state.title = title;
      state.actions = actions;
    },
    accept: (state) => {
      state.open = false;
      state.title = "";
      state.message = "";
      state.actions = [];
    },
    reject: (state) => {
      state.open = false;
      state.title = "";
      state.message = "";
      state.actions = [];
    },
  },
});

export const { requestConfirmation, accept, reject } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
