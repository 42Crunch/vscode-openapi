export type Config = {
  insecureSslHostnames: string[];
  platformUrl: string;
  platformApiToken: string;
};

export type PlatformConnectionTestResult = { success: true } | { success: false; message: string };

export type SaveConfigMessage = { command: "saveConfig"; payload: Config };
export type LoadConfigMessage = { command: "loadConfig"; payload: Config };
export type TestPlatformConnectionMessage = {
  command: "testPlatformConnection";
  payload: undefined;
};
export type ShowPlatformConnectionTestMessage = {
  command: "showPlatformConnectionTest";
  payload: PlatformConnectionTestResult;
};
