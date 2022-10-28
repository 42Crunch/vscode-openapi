import { HttpMethod, HttpRequest, HttpResponse } from "../http";
import type { OasParameterLocation, BundledOpenApiSpec } from "../oas30";

export interface ScandConfiguration {
  pathParameters: Record<string, unknown>;
  queryParameters: Record<string, unknown>;
  headerParameters: Record<string, unknown>;
  cookieParameters: Record<string, unknown>;
  requestBody?: unknown;
  host: string;
}

export interface ScanConfig {
  parameters: Record<OasParameterLocation, Record<string, unknown>>;
  requestBody?: unknown;
  host: string;
}

export interface OasWithOperationAndConfig {
  oas: BundledOpenApiSpec;
  rawOas: string;
  path: string;
  method: HttpMethod;
  config: unknown;
}

export interface ScanRunConfig {
  config: unknown;
  env: Record<string, string>;
  rawOas: string;
}

export interface ErrorMessage {
  message: string;
}

// requests to scan web app
export type ScanOperationMessage = { command: "scanOperation"; payload: OasWithOperationAndConfig };
export type ShowErrorMessage = { command: "showError"; payload: ErrorMessage };
export type ShowScanReportMessage = { command: "showScanReport"; payload: any };
export type ShowResponseMessage = { command: "showScanResponse"; payload: HttpResponse };

type ScanRequest =
  | ScanOperationMessage
  | ShowErrorMessage
  | ShowScanReportMessage
  | ShowResponseMessage;

// responses sent from web app to the vs code extension
type RunScanMessage = { command: "runScan"; payload: ScanRunConfig };
type SendHttpRequestMessage = { command: "sendScanRequest"; payload: HttpRequest };
type SendCurlRequestMessage = { command: "sendCurlRequest"; payload: string };

type ScanResponse = RunScanMessage | SendHttpRequestMessage | SendCurlRequestMessage;

export type { ScanRequest, ScanResponse };
