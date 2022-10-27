import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DataDictionary,
  FlattenedDataFormat,
  FullDataDictionary,
} from "@xliic/common/data-dictionary";

export interface FormatsState {
  dictionaries: DataDictionary[];
  formats: FlattenedDataFormat[];
}

const initialState: FormatsState = {
  dictionaries: [],
  formats: [],
};

export const slice = createSlice({
  name: "formats",
  initialState,
  reducers: {
    showDictionary: (state, action: PayloadAction<FullDataDictionary[]>) => {
      const dictionaries: DataDictionary[] = [];
      const formats: FlattenedDataFormat[] = [];

      for (const dict of action.payload) {
        dictionaries.push({
          id: dict.id,
          name: dict.name,
          description: dict.description,
        });
        for (const format of Object.values(dict.formats)) {
          formats.push({
            ...format,
            dictionaryId: dict.id,
          });
        }
      }

      state.dictionaries = dictionaries;
      state.formats = formats;
    },
  },
});

export const { showDictionary } = slice.actions;

export default slice.reducer;
