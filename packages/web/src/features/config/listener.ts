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

type FeatureState = StateFromReducersMapObject<typeof reducer>;
type FeatureDispatch = ReturnType<typeof initStore>["dispatch"];
type FeatureListening = TypedStartListening<FeatureState, FeatureDispatch>;

export function onConfigChange(
  startAppListening: FeatureListening,
  host: Webapp<NoopMessage, SaveConfigMessage>["host"]
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(saveConfig, addInsecureSslHostname, removeInsecureSslHostname),
      effect: async (action, listenerApi) => {
        const {
          config: { data: config, hasErrors },
        } = listenerApi.getState();
        if (hasErrors) {
          console.log("not saving config, has errors");
        } else {
          host.postMessage({ command: "saveConfig", payload: config });
        }
      },
    });
}

export function onTestPlatformConnection(
  startAppListening: FeatureListening,
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
  startAppListening: FeatureListening,
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
  startAppListening: FeatureListening,
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
