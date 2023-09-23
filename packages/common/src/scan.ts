import { SimpleEnvironment } from "./env";
import { HttpMethod } from "./http";
import { BundledSwaggerOrOasSpec } from "./openapi";
import { ScanReportJSONSchema } from "./scan-report";
import { TryitSecurityValues } from "./tryit";

export interface ScandConfiguration {
  pathParameters: Record<string, unknown>;
  queryParameters: Record<string, unknown>;
  headerParameters: Record<string, unknown>;
  cookieParameters: Record<string, unknown>;
  requestBody?: unknown;
  host: string;
}

export type ScanParameterLocation = "query" | "header" | "path" | "cookie" | "body" | "formData";

export type ScanConfig = {
  parameters: Record<ScanParameterLocation, Record<string, unknown>>;
  requestBody?: unknown;
  host: string;
};

export type OasWithOperationAndConfig = {
  oas: BundledSwaggerOrOasSpec;
  rawOas: string;
  path: string;
  method: HttpMethod;
  config: unknown;
};

export interface SingleOperationScanReport {
  report: ScanReportJSONSchema;
  path: string;
  method: HttpMethod;
  security: TryitSecurityValues | undefined;
}

// requests to scan web app
export type ScanOperationMessage = { command: "scanOperation"; payload: OasWithOperationAndConfig };

export type ShowScanReportMessage = {
  command: "showScanReport";
  payload: SingleOperationScanReport;
};

// responses sent from web app to the vs code extension
export type ShowJsonPointerMessage = {
  command: "showJsonPointer";
  payload: string;
};

export type ShowAuditReportMessage = {
  command: "showAuditReport";
  payload: undefined;
};

export type StartScanMessage = {
  command: "startScan";
  payload: undefined;
};

export type ScandManagerConnection = {
  url: string;
  auth: "none" | "header";
  header: {
    name: string;
    value: string;
  };
};

export type ScanRuntime = {
  kind: "docker" | "scand-manager";
  image: string;
  services: string;
  scandManager: ScandManagerConnection;
};
