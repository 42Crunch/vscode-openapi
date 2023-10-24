import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/scanconf";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";
import config from "../../features/config/slice";
import env, { loadEnv } from "../../features/env/slice";
import prefs from "../../features/prefs/slice";
import router from "../../features/router/slice";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import { showHttpError, showHttpResponse, showScanconfOperation } from "./actions";
import scanconf, { updateScanconf } from "./slice";
import operations from "./operations/slice";
import requests from "./requests/slice";
import auth from "./auth/slice";
import global from "./global/slice";

const reducer = {
  theme,
  scanconf,
  operations,
  requests,
  auth,
  router,
  env,
  prefs,
  config,
  global,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  updateScanconf,
  showHttpError,
  showHttpResponse,
  showScanconfOperation,
  loadEnv,
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
