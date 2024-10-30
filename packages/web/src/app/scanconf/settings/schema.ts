import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

export const schema = z.object({
  environment: z.string(),

  logLevel: z.string(),
  logDestination: z.string(),

  requestFlowrate: z.coerce.number(),
  requestTimeout: z.coerce.number(),
  requestTlsInsecureSkipVerify: z.boolean(),
  responseFollowRedirection: z.boolean(),
  maxScanDuration: z.coerce.number(),
  reportMaxIssues: z.coerce.number(),
  reportMaxSize: z.coerce.number(),
  responseMaxBodySizeScan: z.coerce.number(),
  reportMaxHttpResponseSizeHappyPath: z.coerce.number(),
  reportMaxBodySizeHappyPath: z.coerce.number(),
  reportMaxBodySizeTest: z.coerce.number(),
  reportMaxHttpResponseSizeTest: z.coerce.number(),
});

export function wrapSettings(settings: Playbook.RuntimeConfiguration) {
  return {
    ...settings,
    logLevel: settings.logLevel !== undefined ? settings.logLevel : "",
  };
}

export function unwrapSettings(data: any): Playbook.RuntimeConfiguration {
  return { ...data, logLevel: data.logLevel !== "" ? data.logLevel : undefined };
}
