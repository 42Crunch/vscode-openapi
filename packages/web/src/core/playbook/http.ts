//@ts-ignore
import SwaggerClient from "swagger-client";
import { BundledOpenApiSpec, OasSecurityScheme, OasServer } from "@xliic/common/oas30";
import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import { BundledSwaggerSpec, SwaggerSecurityScheme } from "@xliic/common/swagger";
import { HttpConfig, HttpRequest } from "@xliic/common/http";
import { Config } from "@xliic/common/config";
import { Result } from "@xliic/common/result";

import * as playbook from "@xliic/common/playbook";

import { parseHttpsHostname } from "./util";

import { getParameters } from "./util-swagger";

export async function makeHttpRequest(
  oas: BundledSwaggerOrOasSpec,
  server: string,
  operationId: string | undefined,
  request: playbook.CRequest,
  security: playbook.Credentials
): Promise<Result<HttpRequest, string>> {
  // FIXME, this can throw an exception, make sure it's handled
  try {
    const result = isOpenapi(oas)
      ? await makeHttpRequestForOas(oas, server, operationId, request, security)
      : await makeHttpRequestForSwagger(oas, server, operationId, request, security);

    return [
      {
        method: request.method,
        url: result.url,
        headers: result.headers as any,
        body: convertBody(result.body),
      },
      undefined,
    ];
  } catch (ex) {
    return [undefined, `failed to build http request: ${ex}`];
  }
}

async function makeHttpRequestForOas(
  oas: BundledOpenApiSpec,
  server: string,
  operationId: string | undefined,
  request: playbook.CRequest,
  security: playbook.Credentials
): Promise<HttpRequest> {
  const swaggerClientOperationId = operationId || `${request.method}-${request.path}`;
  const result = SwaggerClient.buildRequest({
    spec: await buildOasSpecWithServers(oas, server, request),
    operationId: swaggerClientOperationId,
    parameters: makeOpenApiSwaggerClientParameters(request.parameters),
    securities: makeOasSecurities(oas?.components?.securitySchemes || {}, security),
    requestContentType: request.body?.mediaType,
    requestBody: request.body?.value,
  });

  return result;
}

async function makeHttpRequestForSwagger(
  oas: BundledSwaggerSpec,
  server: string,
  operationId: string | undefined,
  request: playbook.CRequest,
  security: playbook.Credentials
): Promise<HttpRequest> {
  const swaggerClientOperationId = operationId || `${request.method}-${request.path}`;
  const result = SwaggerClient.buildRequest({
    spec: await buildSwaggerSpecWithServers(oas, server, request),
    operationId: swaggerClientOperationId,
    parameters: makeSwaggerSwaggerClientParameters(oas, request),
    securities: makeSwaggerSecurities(oas?.securityDefinitions || {}, security),
  });
  // FIXME return replacements
  return result;
}

export async function makeExternalHttpRequest(
  request: playbook.ExternalCRequest
): Promise<Result<HttpRequest, string>> {
  const searchParams = new URLSearchParams(request.parameters.query as any).toString();
  try {
    return [
      {
        method: request.method,
        url: searchParams === "" ? request.url : `${request.url}?${searchParams}`,
        headers: request.parameters.header as any,
        body: request.body !== undefined ? convertBody(request.body.value) : undefined,
      },
      undefined,
    ];
  } catch (ex) {
    return [undefined, `failed to build http request: ${ex}`];
  }
}

export function makeHttpConfig(config: Config, request: HttpRequest): HttpConfig {
  const [https, hostname] = parseHttpsHostname(request.url);
  const rejectUnauthorized = https && !config.insecureSslHostnames.includes(hostname);
  return {
    https: {
      rejectUnauthorized,
    },
  };
}

async function buildOasSpecWithServers(
  oas: BundledOpenApiSpec,
  server: string,
  request: playbook.CRequest
): Promise<unknown> {
  // FIXME servers info should be passed from outside
  const servers = [{ url: server }];

  // stringify/parse to make the spec mutable
  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify({ ...oas, servers })),
  });

  return spec;
}

async function buildSwaggerSpecWithServers(
  swagger: BundledSwaggerSpec,
  server: string,
  request: playbook.CRequest
): Promise<unknown> {
  // FIXME servers info should be passed from outside
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

function pickServer(servers: OasServer[], server: string): OasServer[] {
  return servers.filter((s) => s.url === server);
}

function makeOpenApiSwaggerClientParameters(
  parameters: playbook.ParameterValues
): Record<string, unknown> {
  const locations: playbook.ParameterLocation[] = ["query", "header", "path", "cookie"];
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
  request: playbook.CRequest
): Record<string, unknown> {
  const locations: playbook.ParameterLocation[] = ["query", "header", "path"];
  const result: Record<string, unknown> = {};
  for (const location of locations) {
    for (const [name, value] of Object.entries(request.parameters[location] ?? {})) {
      result[`${location}.${name}`] = value;
    }
  }

  const parameters = getParameters(oas, request.path, request.method);
  const bodyParams = Object.keys(parameters.body);
  if (bodyParams.length > 0) {
    const name = bodyParams[0];
    result[`body.${name}`] = request.body?.value;
  }

  // FIXME support formData

  return result;
}

function makeOasSecurities(
  schemes: Record<string, OasSecurityScheme>,
  security: playbook.Credentials
): any {
  const result: any = {};
  for (const name of Object.keys(security)) {
    const scheme = schemes[name];
    const securityValue = security[name];
    if (scheme?.type === "oauth2" || scheme?.type === "openIdConnect") {
      result[name] = { token: { access_token: securityValue } };
    } else {
      result[name] = securityValue;
    }
  }

  console.log("made secuirty", result);
  return { authorized: result };
}

function makeSwaggerSecurities(
  schemes: Record<string, SwaggerSecurityScheme>,
  security: playbook.Credentials
): any {
  const result: any = {};
  for (const name of Object.keys(security)) {
    const scheme = schemes[name];
    const securityValue = security[name];
    if (scheme?.type === "oauth") {
      result[name] = { token: { access_token: securityValue } };
    } else {
      result[name] = securityValue;
    }
  }
  return { authorized: result };
}
