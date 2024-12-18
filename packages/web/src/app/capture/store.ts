import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { Webapp } from "@xliic/common/webapp/capture";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import capture, { saveCapture, showCaptureWindow } from "./slice";

const reducer = {
  theme,
  capture,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showCaptureWindow,
  saveCapture,
};

export const initStore = (listenerMiddleware: ListenerMiddlewareInstance, theme: ThemeState) => {
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
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
