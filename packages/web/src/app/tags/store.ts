import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/tags";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import tags, { loadTags, showHttpError, showHttpResponse } from "./slice";
import { tagsApi } from "./tags-api";
import config, { loadConfig } from "../../features/config/slice";

const reducer = {
  theme,
  config,
  tags,
  [tagsApi.reducerPath]: tagsApi.reducer,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  loadTags,
  loadConfig,
  showHttpResponse,
  showHttpError,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) =>
  configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(logger, tagsApi.middleware),
    preloadedState: {
      theme,
    },
  });

export type RootState = StateFromReducersMapObject<typeof reducer>;
export type AppDispatch = ReturnType<typeof initStore>["dispatch"];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
