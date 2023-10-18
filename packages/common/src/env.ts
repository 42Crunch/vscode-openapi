export type Environment = Record<string, unknown>;
export type SimpleEnvironment = Record<string, string>;

export type NamedEnvironment = { name: string; environment: Environment };

export type EnvironmentStack = NamedEnvironment[];

export type LookupResult = {
  context: string;
  offset: number;
  name: string;
  value: unknown;
};

export type LookupFailure = string;

export type ReplacementResult<T> = {
  value: T;
  found: LookupResult[];
  missing: LookupFailure[];
};

export type DefaultOrSecretsEnvironment = {
  name: "default" | "secrets";
  environment: SimpleEnvironment;
};

export type EnvData = {
  default: SimpleEnvironment;
  secrets: SimpleEnvironment;
};

export type LoadEnvMessage = { command: "loadEnv"; payload: Partial<EnvData> };
export type SaveEnvMessage = { command: "saveEnv"; payload: DefaultOrSecretsEnvironment };
export type ShowEnvWindow = { command: "showEnvWindow"; payload: undefined };
