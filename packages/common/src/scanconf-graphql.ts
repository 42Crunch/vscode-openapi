import { SimpleEnvironment } from "./env";

export type GraphQLWithScanconf = {
  graphQl: string;
  scanconf: string;
};

export type ScanRunConfig = {
  env: SimpleEnvironment;
  scanconf: string;
};

export type FullScanRunConfig = {
  env: SimpleEnvironment;
  scanconf: string;
};

// vs code to webapp requests
export type ShowScanconfOperationMessage = {
  command: "showScanconfOperation";
  payload: GraphQLWithScanconf;
};

export type LoadUpdatedScanconf = {
  command: "loadUpdatedScanconf";
  payload: GraphQLWithScanconf;
};

// webapp to vs code responses
export type SaveScanconfMessage = { command: "saveScanconf"; payload: string };
export type RunScanMessage = { command: "runScan"; payload: ScanRunConfig };
export type RunFullScanMessage = { command: "runFullScan"; payload: FullScanRunConfig };
export type UpdateScanconf = {
  command: "updateScanconf";
  payload: undefined;
};
