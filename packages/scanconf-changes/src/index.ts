import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Scanconf } from "@xliic/scanconf";
import { compare, getOperations } from "./compare";
import { OperationId } from "./types";

import { update } from "./update";

export { compare, update };
export type {
  Change,
  OperationAdded,
  OperationRemoved,
  OperationRenamed,
  SecurityAdded,
} from "./types";

function getCommonOperations(
  oas: BundledSwaggerOrOasSpec,
  scanconfOperations: Record<string, Scanconf.Operation>
): OperationId[] {
  return getOperations(oas).filter((operation) => !!scanconfOperations[operation.operationId]);
}

// paths missing from scanconf, must be paths recently added to the OAS
function pathsMissingFromScanconf(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): string[] {
  const oasPaths = Object.keys(oas.paths);
  const scanconfPaths = Object.keys(scanconf.operations || {});

  return difference(oasPaths, scanconfPaths);
}

// paths missing from from the OAS, must be paths recently removed from the OAS
function pathsMissingFromOas(
  oas: BundledSwaggerOrOasSpec,
  scanconf: Scanconf.ConfigurationFileBundle
): string[] {
  const oasPaths = Object.keys(oas.paths);
  const scanconfPaths = Object.keys(scanconf.operations || {});

  return difference(scanconfPaths, oasPaths);
}

function difference(a: string[], b: string[]): string[] {
  return a.filter((x) => !b.includes(x));
}
