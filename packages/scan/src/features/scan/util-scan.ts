import { ScanConfig } from "@xliic/common/messages/scan";

import {
  BundledOpenApiSpec,
  OasParameterLocation,
  OperationParametersMap,
  getPathItemParameters,
  getOperation,
  getOperationParameters,
  getParametersMap,
  OasSecurityScheme,
} from "@xliic/common/oas30";
import {
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurity,
  TryitSecurityValue,
  TryitSecurityValues,
} from "@xliic/common/messages/tryit";
import { HttpMethod } from "@xliic/common/http";
import { find } from "@xliic/common/jsonpointer";

export function generateParameterValuesForScan(
  oas: BundledOpenApiSpec,
  config: ScanConfig
): TryitParameterValues {
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
    },
    requestBody: requestConfig?.requestBody?.json,
    host: requestConfig.host,
  };
}

export function updateScanConfig(
  config: unknown,
  path: string,
  method: HttpMethod,
  values: TryitOperationValues
): [unknown, Record<string, string>] {
  const mutableConfig = JSON.parse(JSON.stringify(config));

  const target = getRequestConfig(
    mutableConfig,
    (mutableConfig as any)["playbook"]["paths"][path][method]["happyPaths"][0]["requests"][0]
  );

  if (
    values.server.toLowerCase().startsWith("https://localhost") ||
    values.server.toLowerCase().startsWith("http://localhost")
  ) {
    target.host = values.server.replace(/localhost/i, "host.docker.internal");
  } else {
    target.host = values.server;
  }

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

  const security = generateSecurityEnv(values.security, values.securityIndex);

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
  security: TryitSecurityValues,
  selectedIndex: number
): Record<string, string> {
  const result: Record<string, string> = {};
  const selected = security[selectedIndex];
  if (selected) {
    for (const [name, value] of Object.entries(selected)) {
      if (typeof value === "string") {
        result[`SECURITY_${name}`] = value;
      }
    }
  }
  return result;
}

/*

export function generateDefaultValues(
  method: HttpMethod,
  parameters: OperationParametersMap,
  configuration: ScanConfig
): Record<string, any> {
  const values: Record<string, any> = { parameters: {} };
  const locations = Object.keys(parameters) as OasParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(parameters[location])) {
      const value = configuration.parameters[location]?.[name];
      if (value !== undefined) {
        if (!values.parameters[location]) {
          values.parameters[location] = {};
        }
        values.parameters[location][name] = Array.isArray(value) ? wrap(value) : value;
      }
    }
  }

  if (configuration.requestBody !== undefined) {
    values["requestBody"] = JSON.stringify(configuration.requestBody, null, 2);
  }

  values["host"] = configuration.host;
  values["method"] = method;

  return values;
}

// arrays must be wrapped for react form hook
function wrap(array: unknown[]): unknown {
  return array.map((value) => ({ value }));
}*/
