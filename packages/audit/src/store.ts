import { configureStore, StateFromReducersMapObject } from "@reduxjs/toolkit";
import kdbReducer, { KdbState } from "./kdbSlice";
import reportReducer from "./reportSlice";
import themeReducer, { ThemeState } from "./themeSlice";
import { HostApplication } from "./types";

const reducer = {
  report: reportReducer,
  kdb: kdbReducer,
  theme: themeReducer,
};

export const initStore = (hostApplication: HostApplication, kdb: KdbState, theme: ThemeState) =>
  configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: hostApplication,
        },
      }),
    preloadedState: {
      kdb,
      theme,
    },
  });

export type RootState = StateFromReducersMapObject<typeof reducer>;
export type AppDispatch = ReturnType<typeof initStore>["dispatch"];
