import { PayloadAction, createAction } from "@reduxjs/toolkit";
import { HttpConfig, HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { OasWithScanconf, OasWithScanconfPathMethod } from "@xliic/common/scanconf";

export const showScanconfAuth = createAction<OasWithScanconf>("scanconf/showScanconfAuth");

export const showScanconfOperation = createAction<OasWithScanconfPathMethod>(
  "scanconf/showScanconfOperation"
);

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
