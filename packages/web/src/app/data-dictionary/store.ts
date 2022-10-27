import { configureStore, StateFromReducersMapObject } from "@reduxjs/toolkit";
import logger from "redux-logger";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import theme, { ThemeState } from "../../features/theme/slice";
import formats from "./slice";

const reducer = {
  theme,
  formats,
};

export const initStore = (theme: ThemeState) =>
  configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend().concat(logger),
    preloadedState: {
      theme,
    },
  });

export type RootState = StateFromReducersMapObject<typeof reducer>;
export type AppDispatch = ReturnType<typeof initStore>["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
