export type Config = {
  insecureSslHostnames: string[];
  platformUrl: string;
  platformApiToken: string | undefined;
  platformServices: {
    source: "auto" | "manual";
    manual: string | undefined;
    auto: string;
  };
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
