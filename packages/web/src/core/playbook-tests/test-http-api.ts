import { HttpError, HttpResponse } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";
import { Result } from "@xliic/result";

import { AuthResult } from "../playbook/playbook";
import { ExecutionStep } from "../playbook/execute";

export async function* prepare(stage: Playbook.Stage, security?: AuthResult): any {
  const httpRequest = yield {
    stage,
    next: "prepare",
    security,
  };

  return httpRequest;
}

export async function* send(httpRequest: any): any {
  const httpResponse = yield httpRequest;

  return httpResponse;
}

export async function* execute(
  stage: Playbook.Stage,
  securityOverride?: AuthResult
): AsyncGenerator<ExecutionStep, Result<HttpResponse, HttpError>, any> {
  const httpRequest = yield {
    stage,
    next: "prepare",
    securityOverride,
    onFailure: "continue",
  };

  const httpResponse = yield httpRequest;

  return httpResponse;
}
