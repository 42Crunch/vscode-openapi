import React from "react";

export type Route =
  | {
      id: string;
      title: string | JSX.Element;
      link?: undefined;
      element: JSX.Element;
      when?: any;
      children?: Route[];
    }
  | {
      id: string;
      title: string;
      link: string;
      element?: undefined;
      children?: undefined;
      when?: undefined;
    };

export type Routes = Route[];

export const RouterContext = React.createContext<Routes>([]);
