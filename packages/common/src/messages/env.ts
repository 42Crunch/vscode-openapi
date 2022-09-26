export type Environment = Record<string, string>;
export type NamedEnvironment = { name: "default" | "secrets"; environment: Environment };
export type EnvData = {
  default: Environment;
  secrets: Environment;
};

export type ShowEnvMessage = { command: "loadEnv"; payload: EnvData };
type EnvRequest = ShowEnvMessage;

export type SaveEnvMessage = { command: "saveEnv"; payload: NamedEnvironment };
type EnvResponse = SaveEnvMessage;

export type { EnvRequest, EnvResponse };

const ENV_VAR_REGEX = /{{([\w.]+)}}/g;
const SECRETS_PREFIX = "secrets.";

export function replaceEnv(value: string, env: EnvData): string {
  return value.replace(ENV_VAR_REGEX, (match: string, name: string): string => {
    if (name.startsWith("secrets.")) {
      const key = name.substring(SECRETS_PREFIX.length, name.length);
      return env.secrets.hasOwnProperty(key) ? env.secrets[key] : match;
    }
    return env.default.hasOwnProperty(name) ? env.secrets[name] : match;
  });
}
