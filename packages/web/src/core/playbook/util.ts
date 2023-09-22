import { HttpMethod, HttpRequest } from "@xliic/common/http";
import { Result } from "@xliic/common/result";
import { CRequest, RequestStageContent } from "./scanconfig";

import { BundledSwaggerOrOasSpec, isOpenapi } from "@xliic/common/openapi";
import { getOperations as getOasOperations } from "@xliic/common/oas30";
import { getOperations as getSwaggerOperations } from "@xliic/common/swagger";

export type OperationInfo = { method: HttpMethod; path: string; operationId: string };

export function extractOperationInfo(
  oas: BundledSwaggerOrOasSpec,
  stage: RequestStageContent
): Result<OperationInfo, string> {
  const { request } = stage;
  if (request.type === "42c") {
    const operationId = request.details.operationId;
    const operations = isOpenapi(oas) ? getOasOperations(oas) : getSwaggerOperations(oas);
    for (const [path, method, op] of operations) {
      if (op.operationId === operationId && operationId !== undefined) {
        return [{ method, path, operationId }, undefined];
      }
    }
    return [undefined, `can't find operation by operationId: ${operationId}`];
  }
  return [undefined, "unknown request type"];
}

export function parseHttpsHostname(url: string): [boolean, string] {
  try {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const hostname = urlObj.hostname.toLowerCase();
    return [isHttps, hostname];
  } catch (e) {
    return [false, ""];
  }
}
