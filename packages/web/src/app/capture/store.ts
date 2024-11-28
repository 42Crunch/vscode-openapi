import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
//import logger from "redux-logger";
import { setupListeners } from "@reduxjs/toolkit/query";

import { Webapp } from "@xliic/common/webapp/capture";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import capture, {
  browseFilesComplete,
  showCaptureWindow,
  showDownloadResult,
  showExecutionStartResponse,
  showExecutionStatusResponse,
  showPrepareResponse,
  showPrepareUploadFileResponse,
} from "./slice";
//import { platformApi } from "../../features/http-client/platform-api";
// import config, { loadConfig } from "../../features/config/slice";
// import client from "../../features/http-client/slice";

const reducer = {
  theme,
  capture,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showCaptureWindow,
  browseFilesComplete,
  showPrepareResponse,
  showPrepareUploadFileResponse,
  showExecutionStartResponse,
  showExecutionStatusResponse,
  showDownloadResult,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) => {
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    //.concat(logger, platformApi.middleware),
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
