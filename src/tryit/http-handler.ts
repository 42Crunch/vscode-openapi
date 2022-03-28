/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got, { RequestError } from "got";
import { HttpRequest } from "@xliic/common/http";
import { TryItRequest } from "@xliic/common/messages/tryit";

export async function executeHttpRequest(payload: HttpRequest): Promise<TryItRequest> {
  const { url, method, headers, body } = payload;

  try {
    const response = await got(url, {
      throwHttpErrors: false,
      method,
      body,
      headers: {
        ...headers,
      },
    });

    const responseHeaders: [string, string][] = [];
    for (let i = 0; i < response.rawHeaders.length; i += 2) {
      responseHeaders.push([response.rawHeaders[i], response.rawHeaders[i + 1]]);
    }

    console.log("got scan command", url, response);

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

    return {
      command: "showError",
      payload: {
        message,
      },
    };
  }
}
