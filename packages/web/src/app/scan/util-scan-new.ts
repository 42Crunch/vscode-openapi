import { ScanConfig } from "@xliic/common/scan";

import {
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurityAllValues,
} from "@xliic/common/tryit";
import { HttpMethod } from "@xliic/common/http";
import { find } from "@xliic/common/jsonpointer";

export function generateParameterValuesForScan(config: ScanConfig): TryitParameterValues {
  const values: TryitParameterValues = {
    query: config.parameters.query,
    header: config.parameters.header,
    path: config.parameters.path,
    cookie: config.parameters.cookie,
  };

  return values;
}

export function readRawScanConfig(config: unknown, operationId: string): ScanConfig {
  const unpack = function (param?: { key: string; value: unknown }[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (param === undefined) {
      return result;
    }
    for (const { key, value } of param) {
      result[key] = value;
    }
    return result;
  };

  const requestConfig = (config as any)["operations"][operationId]["request"]["request"]["details"];

  return {
    parameters: {
      query: unpack(requestConfig.queries),
      path: unpack(requestConfig.paths),
      header: unpack(requestConfig.headers),
      cookie: unpack(requestConfig.cookies),
      body: {},
      formData: {},
    },
    requestBody: requestConfig?.requestBody?.json,
    host: requestConfig.url,
  };
}

export function updateScanConfig(
  config: unknown,
  operationId: string,
  scanRuntime: "docker" | "scand-manager",
  replaceLocalhost: boolean,
  platform: string,
  values: TryitOperationValues
): [unknown, Record<string, string>] {
  const pack = function (params: Record<string, unknown>) {
    const result = [];
    for (const [key, value] of Object.entries(params)) {
      result.push({ key, value });
    }
    return result;
  };

  const mutableConfig = JSON.parse(JSON.stringify(config));

  const target = (mutableConfig as any)["operations"][operationId]["request"]["request"]["details"];

  const host = optionallyReplaceLocalhost(values.server, scanRuntime, replaceLocalhost, platform);

  // mutableConfig["environments"]["default"]["variables"]["host"]["default"] = host.endsWith("/")
  //   ? host.slice(0, -1)
  //   : host;

  if (target.requestBody && values.body?.value !== undefined) {
    target.requestBody.json = values.body?.value; // TODO multiple media types?
  }
  target.headers = pack(values.parameters.header);
  target.querys = pack(values.parameters.query);
  target.cookies = pack(values.parameters.cookie);
  target.paths = pack(values.parameters.path);

  // remove all methods apart from the one being tested
  mutableConfig["operations"] = {
    [operationId]: mutableConfig["operations"][operationId],
  };

  // update environment.host if present
  if (
    mutableConfig?.["environments"]?.["default"]?.["variables"]?.["host"]?.["default"] !== undefined
  ) {
    mutableConfig["environments"]["default"]["variables"]["host"]["default"] = host;
  }

  const security = generateSecurityEnv(
    values.security,
    values.securityIndex,
    mutableConfig?.environment
  );

  return [mutableConfig, security];
}

function generateSecurityEnv(
  security: TryitSecurityAllValues,
  selectedIndex: number,
  environmentConfig: any
): Record<string, string> {
  const result: Record<string, string> = {};
  const selected = security[selectedIndex];
  if (selected) {
    for (const [name, value] of Object.entries(selected)) {
      const envVarName = extractEnvVariableName(environmentConfig, name);
      if (envVarName !== undefined) {
        if (typeof value === "string") {
          result[envVarName] = value;
        } else {
          result[envVarName] = `${value.username}:${value.password}`;
        }
      }
    }
  }
  return result;
}

function extractEnvVariableName(environmentConfig: any, name: string): string | undefined {
  const value = environmentConfig?.[name];
  const match = value?.match(/env\('(.+)'\)/);
  if (Array.isArray(match)) {
    return match[1];
  }
  const match2 = value?.match(/env_with_default\('(.+)',.+\)/);
  if (Array.isArray(match2)) {
    return match2[1];
  }
}

function optionallyReplaceLocalhost(
  server: string,
  runtime: "docker" | "scand-manager",
  replaceLocalhost: boolean,
  platform: string
) {
  if (
    runtime == "docker" &&
    replaceLocalhost &&
    (platform === "darwin" || platform === "win32") &&
    (server.toLowerCase().startsWith("https://localhost") ||
      server.toLowerCase().startsWith("http://localhost"))
  ) {
    return server.replace(/localhost/i, "host.docker.internal");
  }
  return server;
}

export function optionallyUnreplaceLocalhost(
  value: string,
  runtime: "docker" | "scand-manager",
  replaceLocalhost: boolean,
  platform: string
) {
  if (
    runtime == "docker" &&
    replaceLocalhost &&
    (platform === "darwin" || platform === "win32") &&
    (value.toLowerCase().includes("https://host.docker.internal") ||
      value.toLowerCase().includes("http://host.docker.internal"))
  ) {
    return value.replace("host.docker.internal", "localhost");
  }
  return value;
}
