import { configureStore, StateFromReducersMapObject, TypedStartListening } from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/message";
import {
  SendHttpRequestMessage,
  ShowHttpErrorMessage,
  ShowHttpResponseMessage,
} from "@xliic/common/http";

import client, { sendHttpRequest } from "./slice";

const reducer = { client };
const initStore = () => configureStore({ reducer });

type FeatureState = StateFromReducersMapObject<typeof reducer>;
type FeatureDispatch = ReturnType<typeof initStore>["dispatch"];
type FeatureListening = TypedStartListening<FeatureState, FeatureDispatch>;

type HttpCapableWebappHost = Webapp<
  ShowHttpErrorMessage | ShowHttpResponseMessage,
  SendHttpRequestMessage
>["host"];

export function onSendHttpRequest(
  startAppListening: FeatureListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      actionCreator: sendHttpRequest,
      effect: async ({ payload: { id, request, config } }, listenerApi) => {
        host.postMessage({
          command: "sendHttpRequest",
          payload: { id, request, config: config || { https: { rejectUnauthorized: true } } },
        });
      },
    });
}
