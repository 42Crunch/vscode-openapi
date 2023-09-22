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

/*
const ENV_VAR_REGEX = /{{([\w.\-$]+)}}/g;
const ENTIRE_ENV_VAR_REGEX = /^{{([\w.\-$]+)}}$/;

export function flattenEnvData(env: EnvData): EnvironmentContext {
  const secrets: Environment = {};
  for (const [key, value] of Object.entries(env.secrets)) {
    secrets[`secrets.${key}`] = value;
  }
  return [
    { name: "default", environment: { ...env.default } },
    { name: "secrets", environment: secrets },
  ];
}

export function replaceEnv(value: string, context: EnvironmentContext): ReplacementResult<unknown> {
  const missing: string[] = [];
  const found: LookupResult[] = [];

  const matches = value.match(ENTIRE_ENV_VAR_REGEX);
  if (matches && matches.length === 2) {
    const name = matches[1];
    const lookup = lookupVariable(context, name);
    if (lookup === undefined) {
      missing.push(name);
      return { found, missing, value };
    } else {
      found.push({ ...lookup, offset: matches.index! });
    }
    return { found, missing, value: lookup.value };
  }

  const result = value.replace(
    ENV_VAR_REGEX,
    (match: string, name: string, offset: number): string => {
      const lookup = lookupVariable(context, name);
      if (lookup === undefined) {
        missing.push(name);
        return match;
      }
      found.push({ ...lookup, offset });
      return `${lookup.value}`;
    }
  );

  return {
    found,
    missing,
    value: result,
  };
}

function lookupVariable(
  context: EnvironmentContext,
  varname: string
): { context: string; value: unknown; name: string } | undefined {
  for (const { name, environment } of context) {
    if (environment.hasOwnProperty(varname)) {
      return { context: name, value: environment[varname], name: varname };
    }
  }
}

*/
