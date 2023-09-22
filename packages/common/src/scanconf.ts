import { SimpleEnvironment } from "./env";
import { HttpMethod } from "./http";
import { BundledSwaggerOrOasSpec } from "./openapi";

export type OasWithScanconf = {
  oas: BundledSwaggerOrOasSpec;
  scanconf: string;
};

export type OasWithScanconfPathMethod = OasWithScanconf & {
  path: string;
  method: HttpMethod;
};

export type ScanRunConfig = {
  env: SimpleEnvironment;
  path: string;
  method: HttpMethod;
  operationId: string;
  scanconf: string;
};

// vs code to webapp requests
export type ShowScanconfOperationMessage = {
  command: "showScanconfOperation";
  payload: OasWithScanconfPathMethod;
};
export type UpdateScanconfMessage = { command: "updateScanconf"; payload: string };

// webapp to vs code responses
export type SaveScanconfMessage = { command: "saveScanconf"; payload: string };
export type RunScanMessage = { command: "runScan"; payload: ScanRunConfig };
