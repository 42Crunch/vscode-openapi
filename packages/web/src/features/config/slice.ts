import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import { Config, ConnectionTestResult } from "@xliic/common/config";

export interface ConfigState {
  ready: boolean;
  data: Config;
  errors: Record<ConfigScreen, string | undefined>;
  hasErrors: boolean;
  platformConnectionTestResult?: ConnectionTestResult;
  waitingForPlatformConnectionTest: boolean;
  overlordConnectionTestResult?: ConnectionTestResult;
  waitingForOverlordConnectionTest: boolean;
  scandManagerConnectionTestResult?: ConnectionTestResult;
  waitingForScandManagerConnectionTest: boolean;
}

export type ConfigScreen =
  | "platform-connection"
  | "platform-services"
  | "scan-runtime"
  | "scan-image";

const initialState: ConfigState = {
  ready: false,
  data: {
    insecureSslHostnames: [],
    platformUrl: "https://platform.42crunch.com",
    platformApiToken: "",
    platformServices: {
      source: "auto",
      manual: undefined,
      auto: "services.42crunch.com:8001",
    },
    scandManager: {
      url: "",
      auth: "none",
      header: {
        name: "",
        value: "",
      },
    },
    scanRuntime: "docker",
    scanImage: "",
    docker: {
      replaceLocalhost: true,
      useHostNetwork: true,
    },
    platform: "",
  },
  platformConnectionTestResult: undefined,
  waitingForPlatformConnectionTest: false,
  overlordConnectionTestResult: undefined,
  waitingForOverlordConnectionTest: false,
  scandManagerConnectionTestResult: undefined,
  waitingForScandManagerConnectionTest: false,
  errors: {
    "platform-connection": undefined,
    "platform-services": undefined,
    "scan-image": undefined,
    "scan-runtime": undefined,
  },
  hasErrors: false,
};

export const slice = createSlice({
  name: "config",
  initialState,
  reducers: {
    loadConfig: (state, action: PayloadAction<Config>) => {
      state.data = action.payload;
      state.ready = true;
    },

    saveConfig: (state, action: PayloadAction<Partial<Config>>) => {
      // this is also a hook for a listener
      state.data = { ...state.data, ...action.payload };
      state.data.platformServices.auto = deriveServices(state.data.platformUrl);
      state.platformConnectionTestResult = undefined;
      state.overlordConnectionTestResult = undefined;
      state.scandManagerConnectionTestResult = undefined;
    },

    setError: (state, action: PayloadAction<{ screen: ConfigScreen; error: string }>) => {
      const { screen, error } = action.payload;
      state.errors[screen] = error;
      state.hasErrors = Object.values(state.errors).some((error) => error !== undefined);
    },

    clearError: (state, action: PayloadAction<ConfigScreen>) => {
      state.errors[action.payload] = undefined;
      state.hasErrors = Object.values(state.errors).some((error) => error !== undefined);
    },

    addInsecureSslHostname: (state, action: PayloadAction<string>) => {
      state.data.insecureSslHostnames.push(action.payload);
    },

    removeInsecureSslHostname: (state, action: PayloadAction<string>) => {
      state.data.insecureSslHostnames = state.data.insecureSslHostnames.filter(
        (hostname) => hostname !== action.payload
      );
    },

    testPlatformConnection: (state, action: PayloadAction<undefined>) => {
      state.waitingForPlatformConnectionTest = true;
      state.platformConnectionTestResult = undefined;
      // hook for a listener
    },

    showPlatformConnectionTest: (state, action: PayloadAction<ConnectionTestResult>) => {
      state.platformConnectionTestResult = action.payload;
      state.waitingForPlatformConnectionTest = false;
    },

    testOverlordConnection: (state, action: PayloadAction<undefined>) => {
      state.waitingForOverlordConnectionTest = true;
      state.overlordConnectionTestResult = undefined;
      // hook for a listener
    },

    showOverlordConnectionTest: (state, action: PayloadAction<ConnectionTestResult>) => {
      state.overlordConnectionTestResult = action.payload;
      state.waitingForOverlordConnectionTest = false;
    },

    testScandManagerConnection: (state, action: PayloadAction<undefined>) => {
      state.waitingForScandManagerConnectionTest = true;
      state.scandManagerConnectionTestResult = undefined;
      // hook for a listener
    },

    showScandManagerConnectionTest: (state, action: PayloadAction<ConnectionTestResult>) => {
      state.scandManagerConnectionTestResult = action.payload;
      state.waitingForScandManagerConnectionTest = false;
    },

    showConfigWindow: (state, action: PayloadAction<undefined>) => {
      // hook for a listener
    },
  },
});

function deriveServices(platformUrl: string) {
  try {
    const url = new URL(platformUrl);
    const platformHost = url.hostname;
    if (platformHost.toLowerCase().startsWith("platform")) {
      return platformHost.replace(/^platform/i, "services") + ":8001";
    }
    return "services." + platformHost + ":8001";
  } catch (ex) {
    // failed to parse URL
    return "";
  }
}

export const {
  loadConfig,
  saveConfig,
  showConfigWindow,
  setError,
  clearError,
  testPlatformConnection,
  showPlatformConnectionTest,
  testOverlordConnection,
  showOverlordConnectionTest,
  testScandManagerConnection,
  showScandManagerConnectionTest,
  addInsecureSslHostname,
  removeInsecureSslHostname,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
