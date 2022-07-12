//@ts-ignore
import SwaggerClient from "swagger-client";
import {
  BundledOpenApiSpec,
  OasParameterLocation,
  OasSecurityScheme,
  OasServer,
} from "@xliic/common/oas30";
import { HttpMethod, HttpRequest } from "@xliic/common/http";
import {
  TryitConfig,
  TryitOperationValues,
  TryitParameterValues,
  TryitSecurityValues,
} from "@xliic/common/messages/tryit";

import { parseHttpsHostname } from "../../util";

export async function makeHttpRequest(
  config: TryitConfig,
  oas: BundledOpenApiSpec,
  method: HttpMethod,
  path: string,
  values: TryitOperationValues
): Promise<HttpRequest> {
  const parameters = makeSwaggerClientParameters(values.parameters);
  const servers = pickServer(oas.servers!, values.server);
  const securities = makeSecurities(
    oas?.components?.securitySchemes || {},
    values.security,
    values.securityIndex
  );
  const operationId = `${method}-${path}`;

  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify({ ...oas, servers })),
  });

  // FIXME, this can throw an exception, make sure it's handled
  const request: Request = SwaggerClient.buildRequest({
    spec,
    operationId,
    parameters,
    securities,
    requestContentType: values.body?.mediaType,
    requestBody: values.body?.value,
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

function convertBody(body: unknown): unknown {
  if (typeof body === "string") {
    return body;
  } else if (body instanceof FormData) {
    return Array.from(body.entries());
  }
  return JSON.stringify(body);
}

function pickServer(servers: OasServer[], server: string): OasServer[] {
  return servers.filter((s) => s.url === server);
}

function makeSwaggerClientParameters(parameters: TryitParameterValues): Record<string, unknown> {
  const locations: OasParameterLocation[] = ["query", "header", "path", "cookie"];
  const result: Record<string, unknown> = {};
  for (const location of locations) {
    for (const [name, value] of Object.entries(parameters[location])) {
      result[`${location}.${name}`] = value;
    }
  }
  return result;
}

function makeSecurities(
  schemes: Record<string, OasSecurityScheme>,
  values: TryitSecurityValues,
  index: number
): any {
  const value = values[index];
  if (!value) {
    return undefined;
  }

  const result: any = {};
  for (const name of Object.keys(value)) {
    const scheme = schemes[name];
    if (scheme?.type === "oauth2" || scheme?.type === "openIdConnect") {
      result[name] = { token: { access_token: value[name] } };
    } else {
      result[name] = value[name];
    }
  }
  return { authorized: result };
}
