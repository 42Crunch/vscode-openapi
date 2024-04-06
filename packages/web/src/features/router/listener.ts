import {
  ListenerMiddlewareInstance,
  StateFromReducersMapObject,
  TypedStartListening,
  configureStore,
} from "@reduxjs/toolkit";

import { Webapp, NoopMessage } from "@xliic/common/message";
import { OpenLinkMessage } from "@xliic/common/link";

import { Route } from "./RouterContext";
import { goTo, openLink } from "./slice";

import router from "./slice";

const reducer = { router };
const initStore = () => configureStore({ reducer });

type FeatureState = StateFromReducersMapObject<typeof reducer>;
type FeatureDispatch = ReturnType<typeof initStore>["dispatch"];
type FeatureListening = TypedStartListening<FeatureState, FeatureDispatch>;

export function onOpenLink(
  startAppListening: FeatureListening,
  host: Webapp<NoopMessage, OpenLinkMessage>["host"]
) {
  return () =>
    startAppListening({
      actionCreator: openLink,
      effect: async (action, listenerApi) => {
        host.postMessage({ command: "openLink", payload: action.payload });
      },
    });
}

export function startNavigationListening(
  startListening: ListenerMiddlewareInstance["startListening"],
  routes: Route[],
  parent: Route[] = []
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
