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

export function readRawScanConfig(config: unknown, path: string, method: HttpMethod): ScanConfig {
  const requestConfig = getRequestConfig(
    config,
    (config as any)["playbook"]["paths"][path][method]["happyPaths"][0]["requests"][0]
  );

  return {
    parameters: {
      query: requestConfig.queryParameters,
      path: requestConfig.pathParameters,
      header: requestConfig.headerParameters,
      cookie: requestConfig.cookieParameters,
      body: {},
      formData: {},
    },
    requestBody: requestConfig?.requestBody?.json,
    host: requestConfig.host,
  };
}

export function updateScanConfig(
  config: unknown,
  path: string,
  method: HttpMethod,
  scanRuntime: "docker" | "scand-manager",
  replaceLocalhost: boolean,
  platform: string,
  values: TryitOperationValues
): [unknown, Record<string, string>] {
  const mutableConfig = JSON.parse(JSON.stringify(config));

  const target = getRequestConfig(
    mutableConfig,
    (mutableConfig as any)["playbook"]["paths"][path][method]["happyPaths"][0]["requests"][0]
  );

  const host = optionallyReplaceLocalhost(values.server, scanRuntime, replaceLocalhost, platform);

  target.host = host.endsWith("/") ? host.slice(0, -1) : host;

  target.path = path;
  target.method = method;
  if (target.requestBody && values.body?.value !== undefined) {
    target.requestBody.json = values.body?.value; // TODO multiple media types?
  }
  target.headerParameters = values.parameters.header;
  target.queryParameters = values.parameters.query;
  target.cookieParameters = values.parameters.cookie;
  target.pathParameters = values.parameters.path;

  // remove all methods apart from the one being tested
  mutableConfig["playbook"]["paths"][path] = {
    [method]: mutableConfig["playbook"]["paths"][path][method],
  };

  // update environment.host if present
  if (mutableConfig?.environment?.host !== undefined) {
    mutableConfig.environment.host = host;
  }

  const security = generateSecurityEnv(
    values.security,
    values.securityIndex,
    mutableConfig?.environment
  );

  return [mutableConfig, security];
}

function getRequestConfig(config: any, request: any) {
  if (request["$ref"]) {
    return (find(config, request["$ref"]) as any)["request"]["requestDetails"];
  } else {
    return request["request"]["requestDetails"];
  }
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
  runtime: "docker" | "scand-manager" | "cli",
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
  runtime: "docker" | "scand-manager" | "cli",
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
