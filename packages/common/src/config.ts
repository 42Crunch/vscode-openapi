import { NamingConvention } from "./platform";
import { ScandManagerConnection } from "./scan";

export type Config = {
  insecureSslHostnames: string[];
  platformUrl: string;
  platformAuthType: "anond-token" | "api-token";
  anondToken: string;
  platformApiToken: string;
  platformServices: {
    source: "auto" | "manual";
    manual: string | undefined;
    auto: string;
  };
  platformCollectionNamingConvention?: NamingConvention;
  platformTemporaryCollectionName: string;
  platformMandatoryTags: string;
  docker: {
    replaceLocalhost: boolean;
    useHostNetwork: boolean;
  };
  scandManager: ScandManagerConnection;
  scanRuntime: "docker" | "scand-manager" | "cli";
  auditRuntime: "platform" | "cli";
  scanImage: string;
  platform: string;
  cli: {
    location: string;
    found: boolean;
  };
  cliDirectoryOverride: string;
  repository: string;
  approvedHosts: ApprovedHostConfiguration[];
};

export type ConnectionTestResult = { success: true } | { success: false; message: string };

export type CliTestResult =
  | { success: true; version: string }
  | { success: false; message: string };

export type CliDownloadProgress = {
  percent: number;
  transferred: number;
  total?: number;
};

export type CliDownloadResult =
  | { completed: false; progress: CliDownloadProgress }
  | { completed: true; success: true; location: string }
  | { completed: true; success: false; error: string };

export type SaveConfigMessage = { command: "saveConfig"; payload: Config };

export type LoadConfigMessage = { command: "loadConfig"; payload: Config };

export type TestPlatformConnectionMessage = {
  command: "testPlatformConnection";
  payload: undefined;
};

export type ShowPlatformConnectionTestMessage = {
  command: "showPlatformConnectionTest";
  payload: ConnectionTestResult;
};

export type TestOverlordConnectionMessage = {
  command: "testOverlordConnection";
  payload: undefined;
};

export type ShowOverlordConnectionTestMessage = {
  command: "showOverlordConnectionTest";
  payload: ConnectionTestResult;
};

export type TestScandManagerConnectionMessage = {
  command: "testScandManagerConnection";
  payload: undefined;
};

export type ShowScandManagerConnectionTestMessage = {
  command: "showScandManagerConnectionTest";
  payload: ConnectionTestResult;
};

export type TestCliMessage = {
  command: "testCli";
  payload: undefined;
};

export type ShowCliTestMessage = {
  command: "showCliTest";
  payload: CliTestResult;
};

export type DownloadCliMessage = {
  command: "downloadCli";
  payload: undefined;
};

export type ShowCliDownloadMessage = {
  command: "showCliDownload";
  payload: CliDownloadResult;
};

export type ApprovedHostConfiguration = {
  readonly host: string;
  header?: string;
  prefix?: string;
  token?: string;
};
