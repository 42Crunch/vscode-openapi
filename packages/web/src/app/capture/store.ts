import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";

import { Webapp } from "@xliic/common/webapp/capture";

import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import capture, { saveCapture, setCaptureToken, showCaptureWindow } from "./slice";
import router from "../../features/router/slice";
import confirmationDialog from "../../features/confirmation-dialog/slice";
import config, { loadConfig } from "../../features/config/slice";
import generalError, { showGeneralError } from "../../features/general-error/slice";
import { freemiumdApi } from "../../features/http-client/freemiumd-api";
import client from "../../features/http-client/slice";

const reducer = {
  theme,
  capture,
  router,
  confirmationDialog,
  config,
  client,
  generalError,
  [freemiumdApi.reducerPath]: freemiumdApi.reducer,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showCaptureWindow,
  setCaptureToken,
  saveCapture,
  loadConfig,
  showHttpError: () => null,
  showHttpResponse: () => null,
  showGeneralError,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) => {
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(logger, freemiumdApi.middleware),

    preloadedState: {
      theme,
    },
  });

  setupListeners(store.dispatch);

  return store;
};

export type RootState = StateFromReducersMapObject<typeof reducer>;
export type AppDispatch = ReturnType<typeof initStore>["dispatch"];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
