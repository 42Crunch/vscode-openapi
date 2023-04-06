export type Config = {
  insecureSslHostnames: string[];
};

export type SaveConfigMessage = { command: "saveConfig"; payload: Config };
export type LoadConfigMessage = { command: "loadConfig"; payload: Config };
