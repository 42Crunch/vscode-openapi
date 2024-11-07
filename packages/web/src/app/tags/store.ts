import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";
import { setupListeners } from "@reduxjs/toolkit/query";

import { Webapp } from "@xliic/common/webapp/tags";

import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import tags, { loadTags, showHttpError, showHttpResponse } from "./slice";
import { platformApi } from "../../features/http-client/platform-api";
import config, { loadConfig } from "../../features/config/slice";
import client from "../../features/http-client/slice";

const reducer = {
  theme,
  config,
  client,
  tags,
  [platformApi.reducerPath]: platformApi.reducer,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  loadTags,
  loadConfig,
  showHttpResponse,
  showHttpError,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) => {
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(logger, platformApi.middleware),
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
