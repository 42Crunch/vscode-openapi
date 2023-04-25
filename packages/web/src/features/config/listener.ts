import {
  configureStore,
  isAnyOf,
  StateFromReducersMapObject,
  TypedStartListening,
} from "@reduxjs/toolkit";

import { Webapp, NoopMessage } from "@xliic/common/message";
import {
  SaveConfigMessage,
  TestPlatformConnectionMessage,
  TestOverlordConnectionMessage,
  TestScandManagerConnectionMessage,
} from "@xliic/common/config";

import {
  saveConfig,
  addInsecureSslHostname,
  removeInsecureSslHostname,
  testPlatformConnection,
  testOverlordConnection,
  testScandManagerConnection,
} from "./slice";

import config from "./slice";

const reducer = { config };
const initStore = () => configureStore({ reducer });

type RootState = StateFromReducersMapObject<typeof reducer>;
type AppDispatch = ReturnType<typeof initStore>["dispatch"];
type AppListening = TypedStartListening<RootState, AppDispatch>;

export function onSaveConfig(
  startAppListening: AppListening,
  host: Webapp<NoopMessage, SaveConfigMessage>["host"]
) {
  return () =>
    startAppListening({
      actionCreator: saveConfig,
      effect: async (action, listenerApi) => {
        host.postMessage({
          command: "saveConfig",
          payload: action.payload,
        });
      },
    });
}

export function onTestPlatformConnection(
  startAppListening: AppListening,
  host: Webapp<NoopMessage, SaveConfigMessage | TestPlatformConnectionMessage>["host"]
) {
  return () =>
    startAppListening({
      actionCreator: testPlatformConnection,
      effect: async (action, listenerApi) => {
        const state = listenerApi.getState();
        host.postMessage({
          command: "saveConfig",
          payload: state.config.data,
        });
        host.postMessage({
          command: "testPlatformConnection",
          payload: undefined,
        });
      },
    });
}

export function onTestOverlordConnection(
  startAppListening: AppListening,
  host: Webapp<NoopMessage, SaveConfigMessage | TestOverlordConnectionMessage>["host"]
) {
  return () =>
    startAppListening({
      actionCreator: testOverlordConnection,
      effect: async (action, listenerApi) => {
        const state = listenerApi.getState();
        host.postMessage({
          command: "saveConfig",
          payload: state.config.data,
        });
        host.postMessage({
          command: "testOverlordConnection",
          payload: undefined,
        });
      },
    });
}

export function onTestScandManagerConnection(
  startAppListening: AppListening,
  host: Webapp<NoopMessage, SaveConfigMessage | TestScandManagerConnectionMessage>["host"]
) {
  return () =>
    startAppListening({
      actionCreator: testScandManagerConnection,
      effect: async (action, listenerApi) => {
        const state = listenerApi.getState();
        host.postMessage({
          command: "saveConfig",
          payload: state.config.data,
        });
        host.postMessage({
          command: "testScandManagerConnection",
          payload: undefined,
        });
      },
    });
}

export function onInsecureSslHostnameChange(
  startAppListening: AppListening,
  host: Webapp<NoopMessage, SaveConfigMessage>["host"]
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(addInsecureSslHostname, removeInsecureSslHostname),
      effect: async (action, listenerApi) => {
        const {
          config: { data: config },
        } = listenerApi.getState();
        host.postMessage({ command: "saveConfig", payload: config });
      },
    });
}
