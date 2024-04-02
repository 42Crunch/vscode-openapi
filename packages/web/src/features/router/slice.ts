import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export type Path = string[];

export type RouterState = {
  current: Path;
  history: Path[];
};

export const initialState: RouterState = {
  current: ["starting"],
  history: [],
};

export const slice = createSlice({
  name: "router",
  initialState,
  reducers: {
    goTo: (state, action: PayloadAction<Path>) => {
      state.history.push(state.current);
      state.current = action.payload;
    },
    openLink: (state, action: PayloadAction<string>) => {},
    goBack: (state) => {
      if (state.history.length > 0) {
        state.current = state.history.pop()!;
      }
    },
  },
});

export const { goTo, goBack, openLink } = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
