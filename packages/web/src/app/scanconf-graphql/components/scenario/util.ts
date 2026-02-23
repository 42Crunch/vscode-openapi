import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { wrapEnvironment, wrapResponses } from "../../../scanconf/components/scenario/util";

export function wrapPlaybookRequest(stage: any): Record<string, any> {
  stage = simpleClone(stage);

  return {
    path: stage.request.path,
    method: stage.request.method,
    parameters: stage.request.parameters,
    body: { value: JSON.stringify(stage.request.body.value, null, 2) },
    environment: wrapEnvironment(stage.environment),
    defaultResponse: stage.defaultResponse,
    injectionKey: stage.injectionKey,
    fuzzing: stage.fuzzing,
    operationId: stage.operationId,
    requestOperationId: stage.request.operationId,
    responses: wrapResponses(stage.responses),
    auth: stage.auth,
  };
}

export function wrapExternalPlaybookRequest(stage: any): Record<string, any> {
  stage = simpleClone(stage);

  return {
    url: stage.request.url,
    method: stage.request.method,
    parameters: stage.request.parameters,
    body: { value: JSON.stringify(stage.request.body.value, null, 2) },
    environment: wrapEnvironment(stage.environment),
    defaultResponse: stage.defaultResponse,
    responses: wrapResponses(stage.responses),
  };
}
