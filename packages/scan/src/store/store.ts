import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import logger from "redux-logger";

import theme, { ThemeState } from "@xliic/web-theme";
import route from "../features/router/slice";
import tryit from "../features/tryit/slice";
import scan from "../features/scan/slice";
import env from "../features/env/slice";
import prefs from "../features/prefs/slice";

const reducer = {
  theme,
  tryit,
  scan,
  route,
  env,
  prefs,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) =>
  configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(logger),
    preloadedState: {
      theme,
    },
  });

export type RootState = StateFromReducersMapObject<typeof reducer>;
export type AppDispatch = ReturnType<typeof initStore>["dispatch"];
