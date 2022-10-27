import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { Routes } from "./RouterContext";
import { goTo } from "./slice";

export function startNavigationListening(
  startListening: ListenerMiddlewareInstance["startListening"],
  routes: Routes,
  parent: Routes = []
) {
  for (const route of routes) {
    if (route.when) {
      startListening({
        actionCreator: route.when,
        effect: async (action, listenerApi) => {
          const ids = parent.map((route) => route.id);
          listenerApi.dispatch(goTo([...ids, route.id]));
        },
      });
    }
    if (route.children) {
      startNavigationListening(startListening, route.children, [...parent, route]);
    }
  }
}
