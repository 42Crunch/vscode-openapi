import { createApi } from "@reduxjs/toolkit/query/react";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import type { ConfigState } from "../../features/config/slice";
import { sendHttpRequest } from "./slice";
import { HttpConfig, HttpRequest } from "@xliic/common/http";

export const platformApi = createApi({
  reducerPath: "platformApi",
  baseQuery: webappBaseQuery,
  endpoints: (builder) => ({
    getTags: builder.query<number, string>({
      query: () => `api/v2/tags`,
    }),
  }),
});

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

export const { useGetTagsQuery } = platformApi;
