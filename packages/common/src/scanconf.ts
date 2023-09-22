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

// vs code to webapp requests
export type ShowScanconfAuthMessage = { command: "showScanconfAuth"; payload: OasWithScanconf };

export type ShowScanconfOperationMessage = {
  command: "showScanconfOperation";
  payload: OasWithScanconfPathMethod;
};
export type UpdateScanconfMessage = { command: "updateScanconf"; payload: string };

// webapp to vs code responses
export type SaveScanconfMessage = { command: "saveScanconf"; payload: string };
