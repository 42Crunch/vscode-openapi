/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got, { RequestError } from "got";
import FormData from "form-data";

import { HttpRequest } from "@xliic/common/http";
import { TryItRequest } from "@xliic/common/messages/tryit";

export async function executeHttpRequest(payload: HttpRequest): Promise<TryItRequest> {
  const { url, method, headers, body, config } = payload;

  try {
    const response = await got(url, {
      throwHttpErrors: false,
      method,
      body: restoreBody(body, getContentType(headers)),
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
      command: "showResponse",
      payload: {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        body: response.body,
        httpVersion: response.httpVersion,
        headers: responseHeaders,
      },
    };
  } catch (e: unknown) {
    const { code, message } = e as RequestError;
    const sslError = isSslError(code);
    return {
      command: "showError",
      payload: {
        code,
        message,
        sslError,
      },
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

function restoreBody(body: unknown, contentType: string | undefined): any {
  if (body && contentType === "multipart/form-data") {
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
