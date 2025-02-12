import { createSlice, PayloadAction } from "@reduxjs/toolkit";

//const { getNewParser } = require("./clarinet.js");
import { getNewParser } from "./getNewParser";
var exports = {};
getNewParser(exports);
const parser = (exports as any).parser();

parser.onvalue = function (v: string) {
  console.log("Value: " + v);
};
parser.onkey = function (key: string) {
  // if (key === "v3-global-http-clear") {
  //   console.log("@Key: " + key);
  // }
  // console.log("Key: " + key);
};
parser.onopenobject = function (key: string) {
  if (key === "v3-global-http-clear") {
    console.log("@New Object, first key: " + key);
  }
  //console.log("New Object, first key: " + key);
};
parser.oncloseobject = function () {
  console.log("Close Object");
};

parser.onend = function () {
  console.log("chunk end");
};

export interface CaptureState {
  file: string | undefined;
  chunkSize: number;
  counter: number;
}

const initialState: CaptureState = {
  file: undefined,
  chunkSize: 0,
  counter: 0,
};

export const slice = createSlice({
  name: "bigfiles",
  initialState,
  reducers: {
    browseFile: (state, action: PayloadAction<undefined>) => {
      // -> IDE
    },
    showBrowseFile: (state, action: PayloadAction<{ file: string }>) => {
      state.file = action.payload.file;
    },
    convert: (state, action: PayloadAction<{ file: string }>) => {
      // -> IDE
    },
    sendFileSegment: (
      state,
      action: PayloadAction<{ file: string; textSegment: string; progress: number }>
    ) => {
      state.chunkSize = action.payload.textSegment.length;
      state.counter += 1;
      parser.write(action.payload.textSegment);
      //console.info("exports = " + exports);
    },
  },
});

export const { browseFile, showBrowseFile, convert, sendFileSegment } = slice.actions;
export default slice.reducer;
