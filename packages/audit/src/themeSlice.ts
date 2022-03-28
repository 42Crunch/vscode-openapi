import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ThemeState {
  kind: "light" | "dark";
  foreground?: string;
  background?: string;
}

const initialState: ThemeState = {
  kind: "light",
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    changeTheme: (state, action: PayloadAction<ThemeState>) => {
      state.kind = action.payload.kind;
      if (action.payload.foreground !== undefined) {
        state.foreground = action.payload.foreground;
      }
      if (action.payload.background !== undefined) {
        state.background = action.payload.background;
      }
    },
  },
});

export const { changeTheme } = themeSlice.actions;

export default themeSlice.reducer;
