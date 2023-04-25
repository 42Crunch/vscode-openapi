import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";

import theme, { ThemeState } from "../../features/theme/slice";
import tryit from "./slice";
import env from "../../features/env/slice";
import prefs from "../../features/prefs/slice";
import config from "../../features/config/slice";
import router from "../../features/router/slice";

const reducer = {
  theme,
  tryit,
  router,
  env,
  prefs,
  config,
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
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
