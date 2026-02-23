import { createAction } from "@reduxjs/toolkit";
import { HttpConfig, HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";

import { FullScanRunConfig, ScanRunConfig } from "@xliic/common/scanconf";
import { GraphQLWithScanconf } from "@xliic/common/scanconf-graphql";

export const runScan = createAction<ScanRunConfig>("scanconf/runScan");
export const runFullScan = createAction<FullScanRunConfig>("scanconf/runFullScan");

export const showScanconfOperation = createAction<GraphQLWithScanconf>(
  "scanconf/showScanconfOperation"
);

export const loadUpdatedScanconf = createAction<GraphQLWithScanconf>(
  "scanconf/loadUpdatedScanconf"
);

export const loadPlaybook = createAction<{
  graphQl: any;
  playbook: Playbook.Bundle;
}>("scanconf/loadPlaybook");

export const sendHttpRequest = createAction<{
  id: string;
  request: HttpRequest;
  config: HttpConfig;
  defaultValues: any;
}>("http/sendHttpRequest");

export const showHttpResponse = createAction<{
  id: string;
  response: HttpResponse;
}>("http/showHttpResponse");

export const showHttpError = createAction<{
  id: string;
  error: HttpError;
}>("http/showHttpError");
