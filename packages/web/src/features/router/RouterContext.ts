import React from "react";

export type Route = {
  id: string;
  title: string | JSX.Element;
  element: JSX.Element;
  when?: any;
  children?: Route[];
};

export type Routes = Route[];

export const RouterContext = React.createContext<Routes>([]);
