import { ScandManagerConnection } from "./scan";

export type Config = {
  insecureSslHostnames: string[];
  platformUrl: string;
  platformApiToken: string;
  platformServices: {
    source: "auto" | "manual";
    manual: string | undefined;
    auto: string;
  };
  docker: {
    replaceLocalhost: boolean;
    useHostNetwork: boolean;
  };
  scandManager: ScandManagerConnection;
  scanRuntime: "docker" | "scand-manager";
  scanImage: string;
};

export type ConnectionTestResult = { success: true } | { success: false; message: string };

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
