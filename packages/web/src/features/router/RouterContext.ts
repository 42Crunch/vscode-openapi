import React from "react";

export type ElementRoute = {
  id: string;
  title: string | JSX.Element;
  link?: undefined;
  element: JSX.Element;
  when?: any;
  children?: Route[];
  navigation?: boolean;
};

type LinkRoute = {
  id: string;
  title: string;
  link: string;
  element?: undefined;
  children?: undefined;
  when?: undefined;
  navigation?: undefined;
};

type StartingRoute = ElementRoute & {
  id: "starting";
};

export type Route = ElementRoute | LinkRoute;

export type Routes = [StartingRoute, ...Route[]];

export const RouterContext = React.createContext<Routes>([
  {
    id: "starting",
    title: "Starting",
    element: React.createElement("div", {}, "Empty starting route"),
  },
]);
