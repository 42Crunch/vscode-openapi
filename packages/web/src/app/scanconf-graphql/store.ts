import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";

import { Webapp } from "@xliic/common/webapp/scanconf-graphql";

import config, { loadConfig } from "../../features/config/slice";
import env, { loadEnv } from "../../features/env/slice";
import prefs, { loadPrefs } from "../../features/prefs/slice";
import router from "../../features/router/slice";
import generalError, { showGeneralError } from "../../features/general-error/slice";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import client from "../../features/http-client/slice";
import {
  showHttpError,
  showHttpResponse,
  showScanconfOperation,
  loadUpdatedScanconf,
} from "./actions";
import auth from "./auth/slice";
import requests from "./requests/slice";
import scanconf from "./slice";
import scanconfUpdate from "../scanconf/scanconf-update/slice";
import confirmationDialog from "../../features/confirmation-dialog/slice";

const reducer = {
  theme,
  client,
  scanconf,
  scanconfUpdate,
  requests,
  auth,
  router,
  env,
  prefs,
  config,
  generalError,
  confirmationDialog,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showHttpError,
  showHttpResponse,
  showScanconfOperation,
  loadUpdatedScanconf,
  loadEnv,
  loadConfig,
  loadPrefs,
  showGeneralError,
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
