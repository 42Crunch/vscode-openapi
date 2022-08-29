import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChangeThemePayload } from "@xliic/common/messages/theme";

export interface ThemeState {
  theme?: ChangeThemePayload;
}

const initialState: ThemeState = {
  theme: undefined,
};

export const slice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    changeTheme: (state, action: PayloadAction<ChangeThemePayload>) => {
      state.theme = action.payload;
    },
  },
});

export const { changeTheme } = slice.actions;
export default slice.reducer;
