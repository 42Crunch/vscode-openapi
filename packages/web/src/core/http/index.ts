//@ts-ignore
import SwaggerClient from "swagger-client";
import {
  OpenApi30,
  Swagger,
  BundledSwaggerOrOasSpec,
  HttpMethod,
  isOpenapi,
  RefOr,
  deref,
} from "@xliic/openapi";
import { HttpConfig, HttpRequest } from "@xliic/common/http";
import { Config } from "@xliic/common/config";
import {
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurityAllValues,
  TryitSecurityValue,
  TryItParameterLocation,
} from "@xliic/common/tryit";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";

import { parseHttpsHostname } from "../../util";
import { EnvData } from "@xliic/common/env";
import { getParameters } from "../../util-swagger";
import { ENV_VAR_REGEX } from "../playbook/variables";

export async function makeHttpRequest(
  config: Config,
  oas: BundledSwaggerOrOasSpec,
  method: HttpMethod,
  path: string,
  values: TryitOperationValues,
  env: EnvData
): Promise<[HttpRequest, HttpConfig]> {
  const operationId = `${method}-${path}`;

  // FIXME, this can throw an exception, make sure it's handled
  const request: Request = isOpenapi(oas)
    ? SwaggerClient.buildRequest({
        spec: await buildOasSpec(oas, path, method, values, env),
        operationId,
        parameters: makeOpenApiSwaggerClientParameters(values.parameters),
        securities: makeOasSecurities(oas, values.security, values.securityIndex, env),
        requestContentType: values.body?.mediaType,
        requestBody: replaceEnvVariables(values.body?.value, env),
      })
    : SwaggerClient.buildRequest({
        spec: await buildSwaggerSpec(oas, path, method, values, env),
        operationId,
        parameters: makeSwaggerSwaggerClientParameters(oas, path, method, values, env),
        securities: makeSwaggerSecurities(
          oas?.securityDefinitions || {},
          values.security,
          values.securityIndex,
          env
        ),
      });

  const [https, hostname] = parseHttpsHostname(request.url);
  const rejectUnauthorized = https && !config.insecureSslHostnames.includes(hostname);

  return [
    {
      method,
      url: request.url,
      headers: request.headers as any,
      body: convertBody(request.body),
    },
    {
      https: {
        rejectUnauthorized,
      },
    },
  ];
}

async function buildOasSpec(
  oas: OpenApi30.BundledSpec,
  path: string,
  method: HttpMethod,
  values: TryitOperationValues,
  env: EnvData
): Promise<unknown> {
  // FIXME should depend on values.server?
  const servers = pickServer(oas.servers || [{ url: "http://localhost/" }], values.server);

  // stringify/parse to make the spec mutable
  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify({ ...oas, servers })),
  });

  return spec;
}

async function buildSwaggerSpec(
  swagger: Swagger.BundledSpec,
  path: string,
  method: HttpMethod,
  values: TryitOperationValues,
  env: EnvData
): Promise<unknown> {
  // FIXME should depend on values.server?
  // if no host defined, default to localhost
  const host = swagger.host || "localhost";

  // stringify/parse to make the spec mutable
  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify({ ...swagger, host })),
  });

  return spec;
}

function convertBody(body: unknown): unknown {
  if (typeof body === "string") {
    return body;
  } else if (body instanceof FormData) {
    // FIXME replace env vars as well
    return Array.from(body.entries());
  }
  return JSON.stringify(body);
}

function pickServer(servers: OpenApi30.Server[], server: string): OpenApi30.Server[] {
  return servers.filter((s) => s.url === server);
}

function makeOpenApiSwaggerClientParameters(
  parameters: TryitParameterValues
): Record<string, unknown> {
  const locations: TryItParameterLocation[] = ["query", "header", "path", "cookie"];
  const result: Record<string, unknown> = {};
  for (const location of locations) {
    for (const [name, value] of Object.entries(parameters[location] ?? {})) {
      result[`${location}.${name}`] = value;
    }
  }

  return result;
}

function makeSwaggerSwaggerClientParameters(
  oas: Swagger.BundledSpec,
  path: string,
  method: HttpMethod,
  values: TryitOperationValues,
  env: EnvData
): Record<string, unknown> {
  const locations: TryItParameterLocation[] = ["query", "header", "path"];
  const result: Record<string, unknown> = {};
  for (const location of locations) {
    for (const [name, value] of Object.entries(values.parameters[location] ?? {})) {
      result[`${location}.${name}`] = value;
    }
  }

  const parameters = getParameters(oas, path, method);
  const bodyParams = Object.keys(parameters.body);
  if (bodyParams.length > 0) {
    const name = bodyParams[0];
    result[`body.${name}`] = replaceEnvVariables(values.body?.value, env);
  }

  // FIXME support formData

  return result;
}

function makeOasSecurities(
  oas: OpenApi30.BundledSpec,
  values: TryitSecurityAllValues,
  index: number,
  env: EnvData
): any {
  const value = values[index];
  if (!value) {
    return undefined;
  }

  const schemes = getResolvedOasSecuritySchemes(oas);

  const result: any = {};
  for (const name of Object.keys(value)) {
    const scheme = schemes[name];
    const securityValue = maybeGetSecret(value[name], env);
    if (scheme?.type === "oauth2" || scheme?.type === "openIdConnect") {
      result[name] = { token: { access_token: securityValue } };
    } else {
      result[name] = securityValue;
    }
  }
  return { authorized: result };
}

function getResolvedOasSecuritySchemes(
  oas: OpenApi30.BundledSpec
): Record<string, OpenApi30.SecurityScheme> {
  const resolved: Record<string, OpenApi30.SecurityScheme> = {};
  for (const [name, scheme] of Object.entries(oas.components?.securitySchemes || {})) {
    const result = deref(oas, scheme);
    if (result !== undefined) {
      resolved[name] = result;
    }
  }
  return resolved;
}

function makeSwaggerSecurities(
  schemes: Record<string, Swagger.SecurityScheme>,
  values: TryitSecurityAllValues,
  index: number,
  env: EnvData
): any {
  const value = values[index];
  if (!value) {
    return undefined;
  }

  const result: any = {};
  for (const name of Object.keys(value)) {
    const scheme = schemes[name];
    const securityValue = maybeGetSecret(value[name], env);
    if (scheme?.type === "oauth") {
      result[name] = { token: { access_token: securityValue } };
    } else {
      result[name] = securityValue;
    }
  }
  return { authorized: result };
}

function maybeGetSecret(value: TryitSecurityValue, env: EnvData) {
  if (typeof value === "string") {
    return replaceEnvOld(value, env);
  }

  return value;
}

function replaceEnvVariables(body: unknown, env: EnvData) {
  if (typeof body === "string") {
    return replaceEnvOld(body, env);
  } else if (typeof body === "object") {
    return simpleClone(body, (value) => {
      if (typeof value === "string") {
        return replaceEnvOld(value, env);
      }
      return value;
    });
  }

  return body;
}

export function replaceEnvOld(value: string, env: EnvData): string {
  const SECRETS_PREFIX = "secrets.";
  return value.replace(ENV_VAR_REGEX(), (match: string, name: string): string => {
    if (name.startsWith(SECRETS_PREFIX)) {
      const key = name.substring(SECRETS_PREFIX.length, name.length);
      return env.secrets.hasOwnProperty(key) ? (env.secrets[key] as string) : match;
    }
    return env.default.hasOwnProperty(name) ? (env.default[name] as string) : match;
  });
}
