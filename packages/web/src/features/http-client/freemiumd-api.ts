import { createApi } from "@reduxjs/toolkit/query/react";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import type { ConfigState } from "../../features/config/slice";
import { sendHttpRequest } from "./slice";
import { HttpConfig, HttpRequest } from "@xliic/common/http";

export const freemiumdApi = createApi({
  reducerPath: "freemiumdApi",
  baseQuery: webappBaseQuery,
  endpoints: (builder) => ({
    getSubscription: builder.query<number, string>({
      query: (token) => ({
        path: `subscription?token=${encodeURIComponent(token)}`,
      }),
    }),
  }),
});

async function webappBaseQuery(
  args: { path: string },
  { signal, dispatch, getState }: any,
  extraOptions: any
) {
  const { config }: { config: ConfigState } = getState();
  const { platformUrl, platformApiToken } = config.data;

  console.log("go a", args);
  debugger;

  const client = webappHttpClient(
    { https: { rejectUnauthorized: true } },
    (id: string, request: HttpRequest, config: HttpConfig) =>
      dispatch(sendHttpRequest({ id, request, config }))
  );

  const [response, error] = await client({
    url: `https://stateless.dev.42crunch.com/api/v1/anon/{args.path}`,
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

export const { useGetSubscriptionQuery } = freemiumdApi;
