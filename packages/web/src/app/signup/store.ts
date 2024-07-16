import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/signup";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import logger from "redux-logger";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import signup, { showPlatformConnectionTestError, showAnondTokenResponse } from "./slice";

const reducer = {
  theme,
  signup,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showPlatformConnectionTestError,
  showAnondTokenResponse,
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
