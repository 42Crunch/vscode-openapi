import { createApi } from "@reduxjs/toolkit/query/react";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import type { ConfigState } from "../../features/config/slice";
import { sendHttpRequest } from "./slice";
import { HttpConfig, HttpRequest } from "@xliic/common/http";

export const refreshOptions = {
  refetchOnFocus: true,
  pollingInterval: 1000 * 60 * 10, // refresh every 10 minutes
};

export const platformApi = createApi({
  reducerPath: "platformApi",
  baseQuery: webappBaseQuery,
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryResponseEntry[], void>({
      query: () => `api/v2/categories`,
      transformResponse: extractList,
    }),
    getTags: builder.query<TagResponseEntry[], void>({
      query: () => `api/v2/tags`,
      transformResponse: extractList,
    }),
    getCollections: builder.query<CollectionResponseEntry[], void>({
      query: () => `api/v2/collections?listOption=ALL&perPage=0`,
      transformResponse: extractList,
    }),
    getApisFromCollection: builder.query<ApiResponseEntry[], string>({
      query: (collectionId: string) =>
        `api/v2/collections/${collectionId}/apis?withTags=true&perPage=0`,
      transformResponse: extractList,
    }),
  }),
});

function extractList(response: any) {
  return response.list;
}

async function webappBaseQuery(args: any, { signal, dispatch, getState }: any, extraOptions: any) {
  const { config }: { config: ConfigState } = getState();
  const { platformUrl, platformApiToken } = config.data;

  const client = webappHttpClient(
    { https: { rejectUnauthorized: true } },
    (id: string, request: HttpRequest, config: HttpConfig) =>
      dispatch(sendHttpRequest({ id, request, config }))
  );

  const [response, error] = await client({
    url: `${platformUrl}/${args}`,
    method: "get",
    headers: {
      Accept: "application/json",
      "X-API-KEY": platformApiToken,
      "X-42C-IDE": "true",
    },
  });

  if (error !== undefined) {
    return { error };
  } else {
    return { data: JSON.parse(response.body!) };
  }
}

export type CollectionResponseEntry = {
  desc: {
    id: string;
    name: string;
    technicalName: string;
  };
  summary: {
    apis: number;
    writeApis: boolean;
  };
  teamCounter: number;
  userCounter: number;
};

export type ApiResponseEntry = {
  desc: {
    id: string;
    cid: string;
    name: string;
    technicalName: string;
    specfile?: string;
  };
  assessment: {
    last: string;
    isValid: boolean;
    isProcessed: boolean;
    grade: number;
    numErrors: number;
    numInfos: number;
    numLows: number;
    numMediums: number;
    numHighs: number;
    numCriticals: number;
    releasable: boolean;
    oasVersion: string;
  };
  tags: TagResponseEntry[];
};

export type ResponseEntry = CollectionResponseEntry | ApiResponseEntry;

export type TagResponseEntry = {
  tagId: string;
  tagName: string;
  tagDescription: string;
  color: string;
  dependencies: any;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  categoryDescription: string;
  categoryId: string;
  categoryName: string;
};

export type CategoryResponseEntry = {
  id: string;
  name: string;
  color: string;
  description: string;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  onlyAdminCanTag: boolean;
};

export type Tag = {
  tagId: string;
  tagName: string;
  tagDescription: string;
  onlyAdminCanTag: boolean;
};

export type Category = {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  onlyAdminCanTag: boolean;
  multipleChoicesAllowed: boolean;
  tags: Tag[];
};

export const {
  useGetTagsQuery,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useGetApisFromCollectionQuery,
} = platformApi;
