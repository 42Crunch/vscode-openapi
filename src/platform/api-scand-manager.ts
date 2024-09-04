/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got, { Method, OptionsOfJSONResponseBody, OptionsOfTextResponseBody } from "got";

import { ScandManagerConnection } from "@xliic/common/scan";
import { Logger } from "./types";

export type ScandManagerJobStatus = {
  name: string;
  status: "started" | "active" | "succeeded" | "failed" | "unknown";
};

export async function createJob(
  token: string,
  platformService: string,
  scandImage: string,
  env: any,
  connection: ScandManagerConnection,
  logger: Logger
): Promise<ScandManagerJobStatus> {
  const { body } = <any>await got("api/job", {
    ...gotOptions("POST", connection, logger),
    json: {
      token,
      platformService,
      scandImage,
      env,
    },
  });
  return body as ScandManagerJobStatus;
}

export async function readJobStatus(
  name: string,
  connection: ScandManagerConnection,
  logger: Logger
): Promise<ScandManagerJobStatus> {
  const { body } = await got<any>(`api/job/${name}`, gotOptions("GET", connection, logger));
  return body as ScandManagerJobStatus;
}

export async function readJobLog(
  name: string,
  connection: ScandManagerConnection,
  logger: Logger
): Promise<string> {
  try {
    const { body } = await got(`api/logs/${name}`, gotOptionsText("GET", connection, logger));
    return body;
  } catch (e) {
    return "" + e;
  }
}

export async function deleteJobStatus(
  name: string,
  connection: ScandManagerConnection,
  logger: Logger
): Promise<ScandManagerJobStatus> {
  const { body } = await got<any>(`api/job/${name}`, gotOptions("DELETE", connection, logger));
  return body as ScandManagerJobStatus;
}

export async function testConnection(
  connection: ScandManagerConnection,
  logger: Logger
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await got("api/job", {
      ...gotOptions("GET", connection, logger),
      timeout: {
        request: 5000,
      },
    });
    return { success: true };
  } catch (ex) {
    return { success: false, message: `${ex}` };
  }
}

function gotOptions(
  method: Method,
  connection: ScandManagerConnection,
  logger: Logger
): OptionsOfJSONResponseBody {
  const headers = makeHeaders(connection.header, true);
  return {
    method,
    prefixUrl: connection.url,
    responseType: "json",
    timeout: {
      request: 10000,
    },
    hooks: getHooks(method, logger),
    headers,
  };
}

function gotOptionsText(
  method: Method,
  connection: ScandManagerConnection,
  logger: Logger
): OptionsOfTextResponseBody {
  const headers = makeHeaders(connection.header, false);
  return {
    method,
    prefixUrl: connection.url,
    responseType: "text",
    hooks: getHooks(method, logger),
    headers,
  };
}

function getHooks(method: Method, logger: Logger) {
  const logRequest = (response: any, retryWithMergedOptions: Function) => {
    logger.debug(`${method} ${response.url} ${response.statusCode}`);
    return response;
  };
  return {
    afterResponse: [logRequest],
  };
}

function makeHeaders(
  header: ScandManagerConnection["header"],
  isJsonResponseType: boolean
): {
  [k: string]: string;
} {
  const headers: { [k: string]: string } = {};
  if (header && header.name && header.value) {
    headers[header.name] = header.value;
  }
  if (isJsonResponseType) {
    headers["Accept"] = "application/json";
  }
  return headers;
}
