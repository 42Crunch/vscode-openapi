import { TypedStartListening } from "@reduxjs/toolkit";

import { skipScanconfUpdate } from "../../scanconf/scanconf-update/slice";
import { AppDispatch, RootState } from "../store";

export function onScanconfSkipUpdate(
  startAppListening: TypedStartListening<RootState, AppDispatch>
) {
  return () =>
    startAppListening({
      actionCreator: skipScanconfUpdate,
      effect: async (payload, listenerApi) => {},
    });
}
