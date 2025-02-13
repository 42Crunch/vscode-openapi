import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";
import { SimpleEnvironment } from "./env";

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

export type FullScanRunConfig = {
  env: SimpleEnvironment;
  scanconf: string;
};

// vs code to webapp requests
export type ShowScanconfOperationMessage = {
  command: "showScanconfOperation";
  payload: OasWithScanconfPathMethod;
};

export type LoadUpdatedScanconf = {
  command: "loadUpdatedScanconf";
  payload: OasWithScanconf;
};

// webapp to vs code responses
export type SaveScanconfMessage = { command: "saveScanconf"; payload: string };
export type RunScanMessage = { command: "runScan"; payload: ScanRunConfig };
export type RunFullScanMessage = { command: "runFullScan"; payload: FullScanRunConfig };
export type UpdateScanconf = {
  command: "updateScanconf";
  payload: undefined;
};
