import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/config";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";
import config, {
  loadConfig,
  showOverlordConnectionTest,
  showPlatformConnectionTest,
  showScandManagerConnectionTest,
} from "../../features/config/slice";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";

const reducer = {
  theme,
  config,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  loadConfig,
  showPlatformConnectionTest,
  showOverlordConnectionTest,
  showScandManagerConnectionTest,
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
