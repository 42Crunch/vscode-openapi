import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";

export type OasWithPlaybook = {
  oas: BundledSwaggerOrOasSpec;
  path: string;
  method: HttpMethod;
  scanconf: string;
};

// webapp to vs code responses
export type SaveScanconfMessage = {
  command: "saveScanconf";
  payload: string;
};
