import {
  configureStore,
  isAnyOf,
  StateFromReducersMapObject,
  TypedStartListening,
} from "@reduxjs/toolkit";

import { Webapp, NoopMessage } from "@xliic/common/message";
import { SaveVaultMessage } from "@xliic/common/vault";

import vault, { addScheme, deleteCredential, deleteScheme, updateCredential } from "./slice";

const reducer = { vault };
const initStore = () => configureStore({ reducer });

type FeatureState = StateFromReducersMapObject<typeof reducer>;
type FeatureDispatch = ReturnType<typeof initStore>["dispatch"];
type FeatureListening = TypedStartListening<FeatureState, FeatureDispatch>;

export function onVaultChange(
  startAppListening: FeatureListening,
  host: Webapp<NoopMessage, SaveVaultMessage>["host"]
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(addScheme, deleteScheme, updateCredential, deleteCredential),
      effect: async (action, listenerApi) => {
        const {
          vault: { data: vault },
        } = listenerApi.getState();

        host.postMessage({ command: "saveVault", payload: vault });
      },
    });
}
