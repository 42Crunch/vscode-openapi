/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got, { Method, OptionsOfJSONResponseBody, HTTPError } from "got";
import { AuditCompliance } from "@xliic/common/audit";
import { NamingConvention } from "@xliic/common/platform";

import { ApiAuditReport, Category, SearchCollectionsResponse } from "./types";
import {
  Api,
  ListCollectionsResponse,
  ListApisResponse,
  CollectionData,
  PlatformConnection,
  Logger,
  CollectionFilter,
  UserData,
  Tag,
} from "./types";

import { DataDictionary, DataFormats } from "@xliic/common/data-dictionary";

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
      "X-42C-IDE": "true",
    },
    hooks: {
      afterResponse: [logRequest],
    },
    retry: {
      errorCodes: [
        "ENOMEM",
        "ETIMEDOUT",
        "ECONNRESET",
        "EADDRINUSE",
        "ECONNREFUSED",
        "EPIPE",
        "ENOTFOUND",
        "ENETUNREACH",
        "EAI_AGAIN",
      ],
    },
  };
}

export async function listCollections(
  filter: CollectionFilter | undefined,
  options: PlatformConnection,
  logger: Logger
): Promise<ListCollectionsResponse> {
  try {
    const listOption = filter?.owner ?? "ALL";
    const { body } = await got(
      `api/v2/collections?listOption=${listOption}&perPage=0`,
      gotOptions("GET", options, logger)
    );
    return <ListCollectionsResponse>body;
  } catch (ex: any) {
    throw new Error(
      "Unable to list collections, please check your 42Crunch credentials: " + ex.message
    );
  }
}

export async function searchCollections(
  collectionName: string,
  options: PlatformConnection,
  logger: Logger
): Promise<SearchCollectionsResponse> {
  const params = { collectionName };
  const { body } = <any>await got(`api/v1/search/collections`, {
    ...gotOptions("GET", options, logger),
    searchParams: params,
  });

  return <SearchCollectionsResponse>body;
}

export async function listApis(
  collectionId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<ListApisResponse> {
  const { body } = await got(
    `api/v2/collections/${collectionId}/apis?withTags=true&perPage=0`,
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
): Promise<ApiAuditReport> {
  const { body } = <any>(
    await got(`api/v1/apis/${apiId}/assessmentreport`, gotOptions("GET", options, logger))
  );

  const text = Buffer.from(body.data, "base64").toString("utf-8");
  const data = JSON.parse(text);
  return { tid: body.tid, data };
}

export async function deleteApi(apiId: string, options: PlatformConnection, logger: Logger) {
  await got(`api/v1/apis/${apiId}`, gotOptions("DELETE", options, logger));
}

export async function createApi(
  collectionId: string,
  name: string,
  tags: string[],
  contents: Buffer,
  options: PlatformConnection,
  logger: Logger
): Promise<Api> {
  const { body } = <any>await got("api/v2/apis", {
    ...gotOptions("POST", options, logger),
    json: {
      cid: collectionId,
      tags,
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

export async function getApiNamingConvention(
  options: PlatformConnection,
  logger: Logger
): Promise<NamingConvention> {
  const { body } = await got(
    `api/v1/organizations/me/settings/apiNamingConvention`,
    gotOptions("GET", options, logger)
  );
  return <NamingConvention>body;
}

export async function getCollectionNamingConvention(
  options: PlatformConnection,
  logger: Logger
): Promise<NamingConvention> {
  const { body } = await got(
    "api/v1/organizations/me/settings/collectionNamingConvention",
    gotOptions("GET", options, logger)
  );
  return <NamingConvention>body;
}

export async function getDataDictionaries(
  options: PlatformConnection,
  logger: Logger
): Promise<DataDictionary[]> {
  const {
    body: { list },
  } = await got<any>("api/v2/dataDictionaries", gotOptions("GET", options, logger));
  return (list == null ? [] : list) as DataDictionary[];
}

export async function getDataDictionaryFormats(
  dictionaryId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<DataFormats> {
  const {
    body: { formats },
  } = await got<any>(
    `api/v2/dataDictionaries/${dictionaryId}/formats`,
    gotOptions("GET", options, logger)
  );

  if (formats === null) {
    return {};
  }

  const stringProps = ["maxLength", "minLength"];
  const integerProps = ["minimum", "maximum", "default", "example"];

  for (const value of Object.values<any>(formats)) {
    const type = value["type"];
    let props: string[] = [];
    if (type === "integer") {
      props = integerProps;
    } else if (type === "string") {
      props = stringProps;
    }

    // drop empty default values
    if (value["default"] === "") {
      delete value["default"];
    }

    for (const prop of props) {
      if (value.hasOwnProperty(prop)) {
        value[prop] = parseInt(value[prop], 10);
      }
    }
  }

  return formats as DataFormats;
}

export async function getTags(options: PlatformConnection, logger: Logger): Promise<Tag[]> {
  const { body } = await got(`api/v2/tags`, gotOptions("GET", options, logger));
  return <Tag[]>(body as any).list;
}

export async function getCategories(
  options: PlatformConnection,
  logger: Logger
): Promise<Category[]> {
  const { body } = await got(`api/v2/categories`, gotOptions("GET", options, logger));
  return <Category[]>(body as any).list;
}

export async function createDefaultScanConfig(
  apiId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got(`api/v2/apis/${apiId}/scanConfigurations/default`, {
    ...gotOptions("POST", options, logger),
    json: {
      name: "default",
    },
  });
  return body.id;
}

export async function listScanConfigs(
  apiId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got(`api/v2/apis/${apiId}/scanConfigurations`, {
    ...gotOptions("GET", options, logger),
  });
  return body.list;
}

export async function readScanConfig(
  configId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got(`api/v2/scanConfigurations/${configId}`, {
    ...gotOptions("GET", options, logger),
  });
  return body;
}

export async function createScanConfig(
  apiId: string,
  name: string,
  config: unknown,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const scanConfiguration = Buffer.from(JSON.stringify(config)).toString("base64");
  const { body } = <any>await got(`api/v2/apis/${apiId}/scanConfigurations`, {
    ...gotOptions("POST", options, logger),
    json: {
      name,
      scanConfiguration,
    },
  });
  return body.id;
}

export async function createScanConfigNew(
  apiId: string,
  name: string,
  config: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const scanConfiguration = Buffer.from(config).toString("base64");
  const { body } = <any>await got(`api/v2/apis/${apiId}/scanConfigurations`, {
    ...gotOptions("POST", options, logger),
    json: {
      name,
      file: scanConfiguration,
    },
  });
  return body.id;
}

export async function listScanReports(
  apiId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got(`api/v2/apis/${apiId}/scanReports`, {
    ...gotOptions("GET", options, logger),
  });
  return body.list;
}

export async function readScanReport(
  reportId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got(`api/v2/scanReports/${reportId}`, {
    ...gotOptions("GET", options, logger),
  });
  return body.data;
}

export async function readScanReportNew(
  reportId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got(`api/v2/scanReports/${reportId}`, {
    ...gotOptions("GET", options, logger),
  });
  return body.file;
}

export async function readTechnicalCollection(
  technicalName: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  try {
    const response = await got(`api/v1/collections/technicalName`, {
      ...gotOptions("POST", options, logger),
      json: { technicalName },
    });
    const body: { id: string } = <any>response.body;
    return body.id;
  } catch (err) {
    if (err instanceof HTTPError && err?.response?.statusCode === 404) {
      return null;
    }
    throw err;
  }
}

export async function createTechnicalCollection(
  technicalName: string,
  name: string,
  options: PlatformConnection,
  logger: Logger
): Promise<any> {
  const { body } = <any>await got("api/v1/collections", {
    ...gotOptions("POST", options, logger),
    json: {
      technicalName: technicalName,
      name: name,
      source: "default",
    },
  });
  return body.desc.id;
}

export async function testConnection(
  options: PlatformConnection,
  logger: Logger
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await got("api/v2/collections?page=1&perPage=1", {
      ...gotOptions("GET", options, logger),
      timeout: {
        request: 5000,
      },
    });
    return { success: true };
  } catch (ex) {
    return { success: false, message: `${ex}` };
  }
}

export async function readAuditCompliance(
  taskId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<AuditCompliance> {
  const { body } = <any>(
    await got(`api/v2/sqgs/audit/reportComplianceStatus/${taskId}?readSqg=true&readReport=false`, {
      ...gotOptions("GET", options, logger),
    })
  );
  return body;
}

export async function readAuditReportSqgTodo(
  taskId: string,
  options: PlatformConnection,
  logger: Logger
): Promise<ApiAuditReport> {
  const { body } = <any>(
    await got(`api/v2/sqgs/audit/todo/${taskId}`, gotOptions("GET", options, logger))
  );

  const text = Buffer.from(body.data, "base64").toString("utf-8");
  const data = JSON.parse(text);
  return { tid: body.tid, data };
}
