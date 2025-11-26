import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Webapp } from "@xliic/common/webapp/config";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";
import config, {
  loadConfig,
  showOverlordConnectionTest,
  showPlatformConnectionTest,
  showScandManagerConnectionTest,
  showCliTest,
  showCliDownload,
} from "../../features/config/slice";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import client from "../../features/http-client/slice";

import { platformApi } from "../../features/http-client/platform-api";
import { freemiumdApi } from "../../features/http-client/freemiumd-api";

const reducer = {
  theme,
  config,
  client,
  [platformApi.reducerPath]: platformApi.reducer,
  [freemiumdApi.reducerPath]: freemiumdApi.reducer,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  loadConfig,
  showPlatformConnectionTest,
  showOverlordConnectionTest,
  showScandManagerConnectionTest,
  showCliTest,
  showCliDownload,
  showHttpError: () => null,
  showHttpResponse: () => null,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) => {
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(logger, platformApi.middleware, freemiumdApi.middleware),
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
