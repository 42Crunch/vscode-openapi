//@ts-ignore
import SwaggerClient from "swagger-client";
import { BundledOpenApiSpec, OasSecurityScheme, OasOperation } from "@xliic/common/oas30";
import { BundledSwaggerOrOasSpec, getOperation, isOpenapi } from "@xliic/common/openapi";
import { BundledSwaggerSpec, SwaggerSecurityScheme, SwaggerOperation } from "@xliic/common/swagger";
import { HttpMethod, HttpRequest } from "@xliic/common/http";
import { Result } from "@xliic/common/result";

import * as playbook from "@xliic/common/playbook";

import { checkCredential } from "./util";

import { getParameters } from "./util-swagger";
import { AuthResult } from "./playbook";

export async function makeHttpRequest(
  oas: BundledSwaggerOrOasSpec,
  server: string,
  operationId: string | undefined,
  request: playbook.CRequest,
  security: AuthResult
): Promise<Result<HttpRequest, string>> {
  // FIXME, this can throw an exception, make sure it's handled

  try {
    const result = isOpenapi(oas)
      ? await makeHttpRequestForOas(oas, server, operationId, request, security)
      : await makeHttpRequestForSwagger(oas, server, operationId, request, security);

    // request might contain headers which are not defined in the spec
    // add these extra headers to the request
    for (const { key, value } of request.parameters.header) {
      if (result.headers[key.toLowerCase()] === undefined) {
        result.headers[key] = String(value);
      }
    }

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
  security: AuthResult
): Promise<HttpRequest> {
  const operation = getOperation(oas, request.path, request.method);

  if (operation === undefined) {
    throw new Error(`operation not found for ${request.method} ${request.path}`);
  }

  const swaggerClientOperationId = makeSwaggerClientOperationId(
    request.method,
    request.path,
    operation
  );

  const swaggerContentType = getSwaggerClientContentType(request);

  const result = SwaggerClient.buildRequest({
    spec: await buildOasSpecWithServers(oas, server, request),
    operationId: swaggerClientOperationId,
    parameters: makeOpenApiSwaggerClientParameters(request.parameters, security),
    securities: makeOasSecurities(oas?.components?.securitySchemes || {}, security),
    requestContentType: swaggerContentType,
    requestBody: request.body?.value,
  });

  return result;
}

async function makeHttpRequestForSwagger(
  oas: BundledSwaggerSpec,
  server: string,
  operationId: string | undefined,
  request: playbook.CRequest,
  security: AuthResult
): Promise<HttpRequest> {
  const operation = getOperation(oas, request.path, request.method);

  if (operation === undefined) {
    throw new Error(`operation not found for ${request.method} ${request.path}`);
  }

  const swaggerClientOperationId = makeSwaggerClientOperationId(
    request.method,
    request.path,
    operation
  );

  const result = SwaggerClient.buildRequest({
    spec: await buildSwaggerSpecWithServers(oas, server, request),
    operationId: swaggerClientOperationId,
    parameters: makeSwaggerSwaggerClientParameters(oas, request, security),
    securities: makeSwaggerSecurities(oas?.securityDefinitions || {}, security),
  });

  // FIXME return replacements
  return result;
}

export async function makeExternalHttpRequest(
  request: playbook.ExternalCRequest
): Promise<Result<HttpRequest, string>> {
  const searchParams = new URLSearchParams(
    playbookParameterValueToObject(request.parameters.query)
  ).toString();

  try {
    const headers = playbookParameterValueToObject(request.parameters.header);

    if (request.body?.mediaType !== undefined) {
      headers["Content-Type"] = request.body?.mediaType;
    }

    const body =
      request.body?.mediaType === "application/x-www-form-urlencoded"
        ? makeUrlencodedBody(request.body.value)
        : request.body?.value;

    return [
      {
        method: request.method,
        url: searchParams === "" ? request.url : `${request.url}?${searchParams}`,
        headers,
        body: convertBody(body),
      },
      undefined,
    ];
  } catch (ex) {
    return [undefined, `failed to build http request: ${ex}`];
  }
}

async function buildOasSpecWithServers(
  oas: BundledOpenApiSpec,
  server: string,
  request: playbook.CRequest
): Promise<unknown> {
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
  const urlObj = new URL(server);
  const schemes = urlObj.protocol === "https:" ? ["https"] : ["http"];
  // stringify/parse to make the spec mutable
  const { spec, errors } = await SwaggerClient.resolve({
    spec: JSON.parse(JSON.stringify({ ...swagger, host: urlObj.host, schemes })),
  });

  return spec;
}

function convertBody(body: unknown): unknown {
  if (body === undefined) {
    return undefined;
  } else if (typeof body === "string") {
    return body;
  } else if (body instanceof FormData) {
    // FIXME replace env vars as well
    return Array.from(body.entries());
  }
  return JSON.stringify(body);
}

function makeOpenApiSwaggerClientParameters(
  parameters: playbook.ParameterValues,
  security: AuthResult
): Record<string, unknown> {
  const locations: playbook.ParameterLocation[] = ["path", "query", "header", "cookie"];
  const result = collectParameters(parameters, locations);
  // this is a workaround for having duplicate required header, etc names
  // to supply schema validation to the security scheme
  // swagger client breaks on these, thinking required values are not required
  // remove once we start to use a custom extension in the security schema to specify schema
  for (const { credential, value } of Object.values(security)) {
    if (locations.includes(credential.in as any) && credential.name !== undefined) {
      result[`${credential.in}.${credential.name}`] = value;
    }
  }
  return result;
}

function makeSwaggerSwaggerClientParameters(
  oas: BundledSwaggerSpec,
  request: playbook.CRequest,
  security: AuthResult
): Record<string, unknown> {
  const locations: playbook.ParameterLocation[] = ["path", "query", "header"];
  const result = collectParameters(request.parameters, locations);

  // this is a workaround for having duplicate required header, etc names
  // to supply schema validation to the security scheme
  // swagger client breaks on these, thinking required values are not required
  // remove once we start to use a custom extension in the security schema to specify schema
  for (const { credential, value } of Object.values(security)) {
    if (locations.includes(credential.in as any) && credential.name !== undefined) {
      result[`${credential.in}.${credential.name}`] = value;
    }
  }

  // add request body if defined
  const parameters = getParameters(oas, request.path, request.method);
  const bodyParams = Object.keys(parameters.body);
  if (bodyParams.length > 0) {
    const name = bodyParams[0];
    result[`body.${name}`] = request.body?.value;
  }

  // FIXME support formData

  return result;
}

function collectParameters(
  parameters: playbook.ParameterValues,
  locations: playbook.ParameterLocation[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const location of locations) {
    for (const { key, value } of parameters[location]) {
      const name = `${location}.${key}`;
      if (result[name] === undefined) {
        // value does not exist
        result[name] = value;
      } else if (Array.isArray(result[name])) {
        // array value
        (result[name] as any).push(value);
      } else {
        // second occurence of a value with the same name, convert to array
        result[name] = [result[name], value];
      }
    }
  }
  return result;
}

function makeOasSecurities(schemes: Record<string, OasSecurityScheme>, security: AuthResult): any {
  const matches = matchSecuritySchemesToAuthResult(schemes, security);
  const result: any = {};
  for (const name of Object.keys(matches)) {
    const scheme = schemes[name];
    const securityValue = matches[name];
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
  security: AuthResult
): any {
  const result: any = {};
  const matches = matchSecuritySchemesToAuthResult(schemes, security);
  for (const name of Object.keys(matches)) {
    const scheme = schemes[name];
    const securityValue = matches[name];
    if (scheme?.type === "oauth") {
      result[name] = { token: { access_token: securityValue } };
    } else {
      result[name] = securityValue;
    }
  }

  return { authorized: result };
}

function matchSecuritySchemesToAuthResult(
  schemes: Record<string, OasSecurityScheme | SwaggerSecurityScheme>,
  security: AuthResult
): Record<string, string | undefined> {
  const mutable = { ...security };
  const result: Record<string, string | undefined> = {};
  for (const [schemeName, scheme] of Object.entries(schemes)) {
    for (const [credentialName, { credential, value }] of Object.entries(mutable)) {
      if (checkCredential(credential, scheme)) {
        result[schemeName] = value;
        delete mutable[credentialName];
        break;
      }
    }
  }
  return result;
}

function playbookParameterValueToObject(parameterValue: playbook.ParameterList) {
  // FIXME overwrites duplicate entries
  const result: Record<string, string> = {};
  for (const { key, value } of parameterValue) {
    result[key] = String(value);
  }
  return result;
}

function makeUrlencodedBody(body: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    params.append(key, `${value}`);
  }
  return params.toString();
}

function makeSwaggerClientOperationId(
  method: HttpMethod,
  path: string,
  operation: OasOperation | SwaggerOperation
): string {
  return SwaggerClient.helpers.opId(operation, path, method);
}

function getSwaggerClientContentType(request: playbook.CRequest): string | undefined {
  if (request.body?.mediaType === "raw") {
    for (const { key, value } of request.parameters.header) {
      if (key.toLowerCase() === "content-type") {
        return String(value);
      }
    }
    // if content-type header is not found, fallback to text/plain
    return "text/plain";
  }
  return request.body?.mediaType;
}
