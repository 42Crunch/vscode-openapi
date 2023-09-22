/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got, { RequestError } from "got";
import FormData from "form-data";

import { HttpRequest, HttpResponse, HttpError, HttpConfig } from "@xliic/common/http";
import { ShowHttpResponseMessage, ShowHttpErrorMessage } from "@xliic/common/http";

export async function executeHttpRequest(payload: {
  request: HttpRequest;
  config: HttpConfig;
}): Promise<ShowHttpResponseMessage | ShowHttpErrorMessage> {
  try {
    const response = await executeHttpRequestRaw(payload.request, payload.config);
    return {
      command: "showHttpResponse",
      payload: { id: "", response },
    };
  } catch (e) {
    return {
      command: "showHttpError",
      payload: { id: "", error: e as HttpError },
    };
  }
}

export async function executeHttpRequestRaw(
  payload: HttpRequest,
  config: HttpConfig
): Promise<HttpResponse> {
  const { url, method, headers, body } = payload;

  const restoredBody = restoreBody(body, getContentType(headers));

  // drop Content-Type header if multipart/form-data
  // correct Content-Type will be generated by the client, and will include
  // proper boundary
  if (isMultipartFormData(body, getContentType(headers))) {
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() == "content-type") {
        delete headers[name];
      }
    }
  }

  try {
    const response = await got(url, {
      throwHttpErrors: false,
      method,
      body: restoredBody,
      headers: {
        ...headers,
      },
      https: {
        rejectUnauthorized: config?.https?.rejectUnauthorized ?? true,
      },
    });

    const responseHeaders: [string, string][] = [];
    for (let i = 0; i < response.rawHeaders.length; i += 2) {
      responseHeaders.push([response.rawHeaders[i], response.rawHeaders[i + 1]]);
    }

    return {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      body: response.body,
      httpVersion: response.httpVersion,
      headers: responseHeaders,
    };
  } catch (e: unknown) {
    const { code, message } = e as RequestError;
    const sslError = isSslError(code);
    throw {
      code,
      message,
      sslError,
    };
  }
}

function getContentType(headers: HttpRequest["headers"]): string | undefined {
  for (const [key, value] of Object.entries(headers)) {
    const name = key.toLowerCase();
    if (name == "content-type") {
      return value;
    }
  }
}

function isMultipartFormData(body: unknown, contentType: string | undefined) {
  return body && contentType === "multipart/form-data";
}

function restoreBody(body: unknown, contentType: string | undefined): any {
  if (isMultipartFormData(body, contentType)) {
    const form = new FormData();
    for (const [key, value] of body as [string, string][]) {
      form.append(key, value);
    }
    return form;
  }
  return body;
}

function isSslError(code: string): boolean {
  const codes = [
    "UNABLE_TO_GET_ISSUER_CERT",
    "UNABLE_TO_GET_CRL",
    "UNABLE_TO_DECRYPT_CERT_SIGNATURE",
    "UNABLE_TO_DECRYPT_CRL_SIGNATURE",
    "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY",
    "CERT_SIGNATURE_FAILURE",
    "CRL_SIGNATURE_FAILURE",
    "CERT_NOT_YET_VALID",
    "CERT_HAS_EXPIRED",
    "CRL_NOT_YET_VALID",
    "CRL_HAS_EXPIRED",
    "ERROR_IN_CERT_NOT_BEFORE_FIELD",
    "ERROR_IN_CERT_NOT_AFTER_FIELD",
    "ERROR_IN_CRL_LAST_UPDATE_FIELD",
    "ERROR_IN_CRL_NEXT_UPDATE_FIELD",
    "OUT_OF_MEM",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "CERT_CHAIN_TOO_LONG",
    "CERT_REVOKED",
    "INVALID_CA",
    "PATH_LENGTH_EXCEEDED",
    "INVALID_PURPOSE",
    "CERT_UNTRUSTED",
    "CERT_REJECTED",
    "HOSTNAME_MISMATCH",
  ];

  return codes.includes(code);
}
