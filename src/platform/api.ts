/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got, { HTTPError, Method, OptionsOfJSONResponseBody } from "got";
import FormData from "form-data";
import {
  ApiErrors,
  Api,
  ListCollectionsResponse,
  ListApisResponse,
  CollectionData,
  PlatformConnection,
  Logger,
  CollectionFilter,
  UserData,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleHttpError(err: any, options: PlatformConnection): ApiErrors {
  if (
    err instanceof HTTPError &&
    err?.response?.statusCode === 409 &&
    (<any>err?.response?.body)?.message === "limit reached"
  ) {
    return {
      errors: {
        remote: {
          statusCode: err.response.statusCode,
          error: err.response.body,
          description: `You have reached your maximum number of APIs. Please sign into ${options.platformUrl} and upgrade your account.`,
        },
      },
    };
  } else if (
    err instanceof HTTPError &&
    err?.response?.statusCode === 404 &&
    (<any>err?.response?.body)?.message === "no result" &&
    (<any>err?.response?.body)?.code === 5
  ) {
    return {
      errors: {
        remote: {
          statusCode: err.response.statusCode,
          error: err.response.body,
          description: `API does not exist, check that ID of your mapped API is correct.`,
        },
      },
    };
  }
  throw err;
}

function gotOptions(
  method: Method,
  options: PlatformConnection,
  logger: Logger
): OptionsOfJSONResponseBody {
  const logRequest = (response: any, retryWithMergedOptions: Function) => {
    logger.debug(`${method} ${response.url} ${response.statusCode}`);
    return response;
  };

  return {
    method,
    prefixUrl: options.platformUrl,
    responseType: "json",
    headers: {
      Accept: "application/json",
      "X-API-KEY": options.apiToken,
      "User-Agent": options.userAgent,
      Referer: options.referer,
    },
    hooks: {
      afterResponse: [logRequest],
    },
  };
}

export async function listCollections(
  filter: CollectionFilter | undefined,
  options: PlatformConnection,
  logger: Logger
): Promise<ListCollectionsResponse> {
  const listOption = filter?.owner ?? "ALL";
  const { body } = await got(
    `api/v2/collections?listOption=${listOption}&perPage=0`,
    gotOptions("GET", options, logger)
  );
  return <ListCollectionsResponse>body;
}

export async function listApis(
  collectionId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<ListApisResponse> {
  const { body } = await got(
    `api/v1/collections/${collectionId}/apis?withTags=true&perPage=0`,
    gotOptions("GET", options, logger)
  );
  return <ListApisResponse>body;
}

export async function readApi(
  apiId: string,
  options: PlatformConnection,
  logger: Logger,
  specfile: boolean
): Promise<Api> {
  const params = specfile ? { specfile: "true" } : {};
  const { body } = <any>await got(`api/v1/apis/${apiId}`, {
    ...gotOptions("GET", options, logger),
    searchParams: params,
  });
  return body;
}

export async function readCollection(
  collectionId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<CollectionData> {
  const { body } = <any>(
    await got(
      `api/v1/collections/${collectionId}?readOwner=true`,
      gotOptions("GET", options, logger)
    )
  );
  return body;
}

export async function readCollectionUsers(
  collectionId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<UserData[]> {
  const { body } = <any>(
    await got(`api/v1/collections/${collectionId}/users`, gotOptions("GET", options, logger))
  );
  return body;
}

export async function readAuditReport(
  apiId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>(
    await got(`api/v1/apis/${apiId}/assessmentreport`, gotOptions("GET", options, logger))
  );

  const text = Buffer.from(body.data, "base64").toString("utf-8");
  return JSON.parse(text);
}

export async function deleteApi(apiId: string, options: PlatformConnection, logger: Logger) {
  await got(`api/v1/apis/${apiId}`, gotOptions("DELETE", options, logger));
}

export async function createApi(
  collectionId: string,
  name: string,
  contents: Buffer,
  options: PlatformConnection,
  logger: Logger
): Promise<Api> {
  const { body } = <any>await got("api/v2/apis", {
    ...gotOptions("POST", options, logger),
    json: {
      cid: collectionId,
      name,
      specfile: contents.toString("base64"),
    },
  });

  return body;
}

export async function updateApi(
  apiId: string,
  update: { specfile?: Buffer; name?: string },
  options: PlatformConnection,
  logger: Logger
): Promise<void> {
  const json: any = {};
  if (update.specfile) {
    json.specfile = update.specfile.toString("base64");
  }
  if (update.name) {
    json.name = update.name;
  }

  const { body } = <any>await got(`api/v1/apis/${apiId}`, {
    ...gotOptions("PUT", options, logger),
    json,
  });

  return body;
}

export async function collectionUpdate(
  collectionId: string,
  name: string,
  options: PlatformConnection,
  logger: Logger
): Promise<void> {
  const { body } = <any>await got(`api/v1/collections/${collectionId}`, {
    ...gotOptions("PUT", options, logger),
    json: { name },
  });

  return body;
}

export async function createCollection(
  name: string,
  options: PlatformConnection,
  logger: Logger
): Promise<CollectionData> {
  const { body } = <any>await got("api/v1/collections", {
    ...gotOptions("POST", options, logger),
    json: {
      name: name,
    },
  });
  return body;
}

export async function deleteCollection(
  collectionId: string,
  options: PlatformConnection,
  logger: Logger
) {
  await got(`api/v1/collections/${collectionId}`, gotOptions("DELETE", options, logger));
}
