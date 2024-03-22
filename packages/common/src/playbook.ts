import { BundledSwaggerOrOasSpec, HttpMethod } from "@xliic/openapi";

export type OasWithPlaybook = {
  oas: BundledSwaggerOrOasSpec;
  path: string;
  method: HttpMethod;
  scanconf: string;
};

// vs code to webapp requests
export type TryScenarioMessage = { command: "tryScenario"; payload: OasWithPlaybook };
export type LoadScanconfMessage = {
  command: "loadScanconf";
  payload: {
    oas: BundledSwaggerOrOasSpec;
    scanconf: string;
    uri: string;
  };
};
export type UpdateScanconfMessage = { command: "updateScanconf"; payload: string };
export type ShowAuthWindow = { command: "showAuthWindow"; payload: undefined };

// webapp to vs code responses
export type SaveScanconfMessage = {
  command: "saveScanconf";
  payload: string;
};
