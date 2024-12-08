import { configureStore, StateFromReducersMapObject, TypedStartListening } from "@reduxjs/toolkit";

import confirmationDialog, { accept } from "./slice";

const reducer = { confirmationDialog };
const initStore = () => configureStore({ reducer });

type FeatureState = StateFromReducersMapObject<typeof reducer>;
type FeatureDispatch = ReturnType<typeof initStore>["dispatch"];
type FeatureListening = TypedStartListening<FeatureState, FeatureDispatch>;

export function onConfirmationAccept(startAppListening: FeatureListening) {
  return () =>
    startAppListening({
      actionCreator: accept,
      effect: async (action, listenerApi) => {
        const confirmedActions = listenerApi.getOriginalState().confirmationDialog.actions;
        for (const confirmedAction of confirmedActions) {
          listenerApi.dispatch(confirmedAction);
        }
      },
    });
}
