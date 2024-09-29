import { createApi } from "@reduxjs/toolkit/query/react";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import { sendHttpRequest } from "./slice";
import { HttpConfig, HttpRequest } from "@xliic/common/http";

export type Subscription = {
  userEmail: string;
  subscriptionKind: string;
  periodStart: string;
  monthlyAudit: number;
  bonusAuditOp: number;
  currentAuditUsage: number;
  monthlyScan: number;
  bonusScanOp: number;
  currentScanUsage: number;
};

export const freemiumdApi = createApi({
  reducerPath: "freemiumdApi",
  baseQuery: webappBaseQuery,
  endpoints: (builder) => ({
    getSubscription: builder.query<Subscription, string>({
      query: (token: string) => {
        return {
          path: `subscription?token=${encodeURIComponent(token)}`,
        };
      },
    }),
  }),
});

async function webappBaseQuery(
  args: { path: string },
  { signal, dispatch, getState }: any,
  extraOptions: any
) {
  const url = `https://stateless.42crunch.com/api/v1/anon/${args.path}`;

  const client = webappHttpClient(
    { https: { rejectUnauthorized: true } },
    (id: string, request: HttpRequest, config: HttpConfig) =>
      dispatch(sendHttpRequest({ id, request, config }))
  );

  const [response, error] = await client({
    url,
    method: "get",
    headers: {
      Accept: "application/json",
    },
  });

  if (error !== undefined) {
    return { error };
  } else if (response.statusCode !== 200) {
    return { error: { message: response.body, code: response.statusCode } };
  } else {
    return { data: JSON.parse(response.body!) };
  }
}

export const { useGetSubscriptionQuery } = freemiumdApi;
