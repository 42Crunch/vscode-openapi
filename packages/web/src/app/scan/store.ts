import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import logger from "redux-logger";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import theme, { ThemeState } from "../../features/theme/slice";
import router from "../../features/router/slice";
import scan from "./slice";
import env from "../../features/env/slice";
import prefs from "../../features/prefs/slice";
import config from "../../features/config/slice";
import logging from "../../features/logging/slice";

const reducer = {
  theme,
  scan,
  router,
  env,
  prefs,
  config,
  logging,
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
