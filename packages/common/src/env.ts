import { Path } from "@xliic/preserving-json-yaml-parser";

export type Environment = Record<string, unknown>;
export type SimpleEnvironment = Record<string, string>;

export type NamedEnvironment = { name: string; environment: Environment };

export type EnvironmentStack = NamedEnvironment[];

export type LookupResult = {
  name: string;
  value: unknown;
  location: Path;
  offset: number;
  context: string;
};

export type LookupFailure = {
  name: string;
  location: Path;
};

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
