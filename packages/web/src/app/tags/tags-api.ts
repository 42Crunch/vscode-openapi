import { createApi } from "@reduxjs/toolkit/query/react";
import { HttpConfig, HttpRequest } from "@xliic/common/http";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import { sendHttpRequest } from "./slice";
import { ConfigState } from "../../features/config/slice";
import {
  ApiResponseEntry,
  CategoryResponseEntry,
  CollectionResponseEntry,
  TagResponseEntry,
} from "./types";

export const tagsApi = createApi({
  reducerPath: "tagsApi",
  baseQuery: webappBaseQuery,
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryResponseEntry[], void>({
      query: () => `api/v2/categories`,
    }),
    getTags: builder.query<TagResponseEntry[], void>({
      query: () => `api/v2/tags`,
    }),
    getCollections: builder.query<CollectionResponseEntry[], void>({
      query: () => `api/v2/collections?listOption=ALL&perPage=0`,
    }),
    getApisFromCollection: builder.query<ApiResponseEntry[], string>({
      query: (collectionId: string) =>
        `api/v2/collections/${collectionId}/apis?withTags=true&perPage=0`,
    }),
  }),
});

async function webappBaseQuery(args: any, { signal, dispatch, getState }: any, extraOptions: any) {
  const { config }: { config: ConfigState } = getState();
  const { platformUrl, platformApiToken } = config.data;

  const client = webappHttpClient(
    { https: { rejectUnauthorized: true } },
    (id: string, request: HttpRequest, config: HttpConfig) => {
      dispatch(sendHttpRequest({ id, request, config }));
    }
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
  } else if (response.statusCode !== 200) {
    return { error: { message: response.body, code: response.statusCode } };
  } else {
    return { data: JSON.parse(response.body!).list };
  }
}

export const {
  useGetCategoriesQuery,
  useGetTagsQuery,
  useGetCollectionsQuery,
  useGetApisFromCollectionQuery,
} = tagsApi;
