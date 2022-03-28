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
  path: string;
  method: HttpMethod;
  config: ScanConfig;
}

export interface ScanConfigForOperation {
  path: string;
  method: HttpMethod;
  config: ScanConfig;
}

export interface ErrorMessage {
  message: string;
}

// requests to scan web app
type ScanOperationMessage = { command: "scanOperation"; payload: OasWithOperationAndConfig };
type ShowErrorMessage = { command: "showError"; payload: ErrorMessage };
type ShowScanReportMessage = { command: "showScanReport"; payload: any };
type ScanRequest = ScanOperationMessage | ShowErrorMessage | ShowScanReportMessage;

// responses sent from web app to the vs code extension
type RunScanMessage = { command: "updateScanConfig"; payload: ScanConfigForOperation };
type ScanResponse = RunScanMessage;

export type { ScanRequest, ScanResponse };
