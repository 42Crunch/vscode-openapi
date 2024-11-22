import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import * as z from "zod";

import {
  CliDownloadResult,
  CliTestResult,
  Config,
  ConnectionTestResult,
} from "@xliic/common/config";

export interface ConfigState {
  ready: boolean;
  data: Config;
  errors: Record<ConfigScreenId, string | undefined>;
  hasErrors: boolean;
  platformConnectionTestResult?: ConnectionTestResult;
  waitingForPlatformConnectionTest: boolean;
  overlordConnectionTestResult?: ConnectionTestResult;
  waitingForOverlordConnectionTest: boolean;
  scandManagerConnectionTestResult?: ConnectionTestResult;
  waitingForScandManagerConnectionTest: boolean;
  cliTestResult?: CliTestResult;
  waitingForCliTest: boolean;
  waitingForCliDownload: boolean;
  cliDownloadPercent: number;
  cliDownloadError?: string;
}

export type ConfigScreenId =
  | "platform-connection"
  | "platform-services"
  | "temporary-collection"
  | "mandatory-tags"
  | "runtime-binary"
  | "runtime-scand-manager"
  | "runtime-docker"
  | "audit-runtime"
  | "scan-runtime"
  | "openapi-external-refs";

export type ConfigScreen = {
  id: ConfigScreenId;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
};

const initialState: ConfigState = {
  ready: false,
  data: {
    insecureSslHostnames: [],
    platformUrl: "https://platform.42crunch.com",
    platformAuthType: "anond-token",
    platformApiToken: "",
    anondToken: "",
    platformServices: {
      source: "auto",
      manual: undefined,
      auto: "services.42crunch.com:8001",
    },
    scandManager: {
      url: "",
      auth: "none",
      timeout: 300,
      header: {
        name: "",
        value: "",
      },
    },
    auditRuntime: "platform",
    scanRuntime: "docker",
    scanImage: "",
    docker: {
      replaceLocalhost: true,
      useHostNetwork: true,
    },
    platform: "",
    cli: { found: false, location: "" },
    cliDirectoryOverride: "",
    repository: "",
    platformTemporaryCollectionName: "",
    platformMandatoryTags: "",
    approvedHosts: [],
  },
  platformConnectionTestResult: undefined,
  waitingForPlatformConnectionTest: false,
  overlordConnectionTestResult: undefined,
  waitingForOverlordConnectionTest: false,
  scandManagerConnectionTestResult: undefined,
  waitingForScandManagerConnectionTest: false,
  cliTestResult: undefined,
  waitingForCliTest: false,
  waitingForCliDownload: false,
  cliDownloadPercent: 0,
  errors: {
    "platform-connection": undefined,
    "platform-services": undefined,
    "temporary-collection": undefined,
    "mandatory-tags": undefined,
    "runtime-binary": undefined,
    "runtime-docker": undefined,
    "runtime-scand-manager": undefined,
    "audit-runtime": undefined,
    "scan-runtime": undefined,
    "openapi-external-refs": undefined,
  },
  hasErrors: false,
};

export const slice = createSlice({
  name: "config",
  initialState,
  reducers: {
    loadConfig: (state, action: PayloadAction<Config>) => {
      if (!state.ready) {
        // first load
        state.ready = true;
        state.data = action.payload;
      } else {
        // subsequent loads
        state.data.cli = action.payload.cli;
      }
    },

    saveConfig: (state, action: PayloadAction<Partial<Config>>) => {
      // this is also a hook for a listener
      state.data = { ...state.data, ...action.payload };
      state.data.platformServices.auto = deriveServices(state.data.platformUrl);
      state.platformConnectionTestResult = undefined;
      state.overlordConnectionTestResult = undefined;
      state.scandManagerConnectionTestResult = undefined;
      state.cliDownloadError = undefined;
      state.cliTestResult = undefined;
    },

    setError: (state, action: PayloadAction<{ screen: ConfigScreenId; error: string }>) => {
      const { screen, error } = action.payload;
      state.errors[screen] = error;
      state.hasErrors = Object.values(state.errors).some((error) => error !== undefined);
    },

    clearError: (state, action: PayloadAction<ConfigScreenId>) => {
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

    testCli: (state, action: PayloadAction<undefined>) => {
      state.waitingForCliTest = true;
      state.cliTestResult = undefined;
      // hook for a listener
    },

    showCliTest: (state, action: PayloadAction<CliTestResult>) => {
      state.cliTestResult = action.payload;
      state.waitingForCliTest = false;
    },

    downloadCli: (state, action: PayloadAction<undefined>) => {
      state.waitingForCliDownload = true;
      state.cliTestResult = undefined;
      state.cliDownloadError = undefined;
      // hook for a listener
    },

    showCliDownload: (state, action: PayloadAction<CliDownloadResult>) => {
      state.cliTestResult = undefined;
      if (action.payload.completed) {
        state.waitingForCliDownload = false;
        state.cliDownloadPercent = 0;
        if (action.payload.success) {
          state.data.cli.location = action.payload.location;
          state.data.cli.found = true;
        } else {
          state.data.cli.found = false;
          state.cliDownloadError = action.payload.error;
        }
      } else {
        state.waitingForCliDownload = true;
        state.cliDownloadPercent = action.payload.progress.percent;
      }
    },

    openLink: (state, action: PayloadAction<string>) => {
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
  testCli,
  showCliTest,
  downloadCli,
  showCliDownload,
  openLink,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
