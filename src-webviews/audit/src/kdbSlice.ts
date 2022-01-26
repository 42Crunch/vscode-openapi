import { createSlice } from "@reduxjs/toolkit";

export interface KdbState {
  [key: string]: any;
}

const initialState: KdbState = {};

export const reportSlice = createSlice({
  name: "kdb",
  initialState,
  reducers: {},
});

export default reportSlice.reducer;
