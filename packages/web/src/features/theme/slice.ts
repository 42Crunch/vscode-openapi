import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { ChangeThemePayload } from "@xliic/common/theme";

export interface ThemeState {
  kind?: ChangeThemePayload["kind"];
  theme?: ChangeThemePayload["theme"];
}

const initialState: ThemeState = {
  theme: undefined,
  kind: undefined,
};

export const slice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    changeTheme: (state, action: PayloadAction<ChangeThemePayload>) => {
      state.kind = action.payload.kind;
      state.theme = { ...state.theme, ...(action.payload.theme ?? {}) };
      if (state.kind === "light") {
        state.theme.computedOne = "rgba(0, 0, 0, 0.05)";
        state.theme.computedTwo = "rgba(0, 0, 0, 0.1)";
      } else if (state.kind === "dark") {
        state.theme.computedOne = "rgba(255, 255, 255, 0.05)";
        state.theme.computedTwo = "rgba(255, 255, 255, 0.1)";
      } else {
        state.theme.computedOne = "transparent";
        state.theme.computedTwo = "transparent";
      }
    },
  },
});

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export const { changeTheme } = slice.actions;
export default slice.reducer;
