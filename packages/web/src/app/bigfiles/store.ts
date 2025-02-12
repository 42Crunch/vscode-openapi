import {
  configureStore,
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { Webapp } from "@xliic/common/webapp/bigfiles";
import theme, { changeTheme, ThemeState } from "../../features/theme/slice";
import bigfiles, { showBrowseFile, sendFileSegment } from "./slice";

const reducer = {
  theme,
  bigfiles,
};

export const messageHandlers: Webapp["webappHandlers"] = {
  changeTheme,
  showBrowseFile,
  sendFileSegment,
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
