import {
  createListenerMiddleware,
  TypedStartListening,
  UnsubscribeListener,
} from "@reduxjs/toolkit";
import { Webapp } from "@xliic/common/webapp/config";
import { AppDispatch, RootState } from "./store";
import { startListeners } from "../webapp";
import * as configListener from "../../features/config/listener";

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

export function createListener(host: Webapp["host"]) {
  const listeners: Record<keyof Webapp["hostHandlers"], () => UnsubscribeListener> = {
    saveConfig: configListener.onSaveConfig(startAppListening, host),
    testOverlordConnection: configListener.onTestOverlordConnection(startAppListening, host),
    testScandManagerConnection: configListener.onTestScandManagerConnection(
      startAppListening,
      host
    ),
    testPlatformConnection: configListener.onTestPlatformConnection(startAppListening, host),
  };

  startListeners(listeners);

  return listenerMiddleware;
}
