//@ts-ignore
import SwaggerClient from "swagger-client";
import { BundledOpenApiSpec, OasSecurityScheme, OasServer } from "@xliic/common/oas30";
import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import { BundledSwaggerSpec, SwaggerSecurityScheme } from "@xliic/common/swagger";

import { HttpMethod, HttpRequest } from "@xliic/common/http";
import {
  TryitConfig,
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurityAllValues,
  TryitSecurityValue,
  TryItParameterLocation,
} from "@xliic/common/tryit";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";

import { parseHttpsHostname } from "../../util";
import { EnvData } from "@xliic/common/env";
import { replaceEnv } from "@xliic/common/env";
import { getParameters } from "../../util-swagger";

export async function makeHttpRequest(
  config: TryitConfig,
  oas: BundledSwaggerOrOasSpec,
  method: HttpMethod,
  path: string,
  values: TryitOperationValues,
  env: EnvData
): Promise<HttpRequest> {
  const operationId = `${method}-${path}`;

  // FIXME, this can throw an exception, make sure it's handled
  const request: Request = isOpenapi(oas)
    ? SwaggerClient.buildRequest({
        spec: await buildOasSpec(oas, path, method, values, env),
        operationId,
        parameters: makeOpenApiSwaggerClientParameters(values.parameters),
        securities: makeOasSecurities(
          oas?.components?.securitySchemes || {},
          values.security,
          values.securityIndex,
          env
        ),
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

  return {
    method,
    url: request.url,
    headers: request.headers as any,
    body: convertBody(request.body),
    config: {
      https: {
        rejectUnauthorized,
      },
    },
  };
}

async function buildOasSpec(
  oas: BundledOpenApiSpec,
  path: string,
  method: HttpMethod,
  values: TryitOperationValues,
  env: EnvData
): Promise<unknown> {
  const servers = pickServer(oas.servers!, values.server);

  // stringify/parse to make the spec mutable
  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify({ ...oas, servers })),
  });

  return spec;
}

async function buildSwaggerSpec(
  swagger: BundledSwaggerSpec,
  path: string,
  method: HttpMethod,
  values: TryitOperationValues,
  env: EnvData
): Promise<unknown> {
  // stringify/parse to make the spec mutable
  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify(swagger)),
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

function pickServer(servers: OasServer[], server: string): OasServer[] {
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
  oas: BundledSwaggerSpec,
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
  schemes: Record<string, OasSecurityScheme>,
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
    if (scheme?.type === "oauth2" || scheme?.type === "openIdConnect") {
      result[name] = { token: { access_token: securityValue } };
    } else {
      result[name] = securityValue;
    }
  }
  return { authorized: result };
}

function makeSwaggerSecurities(
  schemes: Record<string, SwaggerSecurityScheme>,
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
    return replaceEnv(value, env);
  }

  return value;
}

function replaceEnvVariables(body: unknown, env: EnvData) {
  if (typeof body === "string") {
    return replaceEnv(body, env);
  } else if (typeof body === "object") {
    return simpleClone(body, (value) => {
      if (typeof value === "string") {
        return replaceEnv(value, env);
      }
      return value;
    });
  }

  return body;
}
