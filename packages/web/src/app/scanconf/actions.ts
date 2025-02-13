import { createAction } from "@reduxjs/toolkit";
import { HttpConfig, HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import {
  OasWithScanconfPathMethod,
  ScanRunConfig,
  FullScanRunConfig,
  OasWithScanconf,
} from "@xliic/common/scanconf";

export const runScan = createAction<ScanRunConfig>("scanconf/runScan");
export const runFullScan = createAction<FullScanRunConfig>("scanconf/runFullScan");

export const showScanconfOperation = createAction<OasWithScanconfPathMethod>(
  "scanconf/showScanconfOperation"
);

export const loadUpdatedScanconf = createAction<OasWithScanconf>("scanconf/loadUpdatedScanconf");

export const loadPlaybook = createAction<{
  oas: BundledSwaggerOrOasSpec;
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
