import { Environment } from "@xliic/common/env";
import { Playbook } from "@xliic/scanconf";

export type PlaybookVariableSuccessfullAssignment = {
  name: string;
  value: unknown;
  error: undefined;
};

export type PlaybookVariableFailedAssignment = {
  name: string;
  error: string;
  value: undefined;
  assignment: Playbook.VariableAssignment;
};

export type PlaybookVariableAssignment =
  | PlaybookVariableSuccessfullAssignment
  | PlaybookVariableFailedAssignment;

export type PlaybookEnv = {
  id: PlaybookVariableDefinitionLocation;
  env: Environment;
  assignments: PlaybookVariableAssignments;
};
export type PlaybookVariableAssignments = PlaybookVariableAssignment[];

export type PlaybookEnvStack = PlaybookEnv[];

export type EnvStackLookupResult = {
  context: PlaybookVariableDefinitionLocation;
  value: unknown;
  name: string;
};

export type PlaybookStageVariableLocation =
  | { type: "playbook-request"; name: string; step: number; responseCode: string }
  | { type: "playbook-stage"; name: string; step: number; responseCode: string };

export type PlaybookVariableDefinitionLocation =
  | { type: "global-environment" }
  | { type: "built-in" }
  | { type: "try-inputs" }
  | { type: "stage-environment" }
  | { type: "request-environment" }
  | PlaybookStageVariableLocation;

export type PlaybookVariableUseLocation =
  | { type: "stage-environment" }
  | { type: "request-environment" };

export function lookup(
  envStack: PlaybookEnvStack,
  varname: string
): EnvStackLookupResult | undefined {
  for (let i = envStack.length - 1; i >= 0; i--) {
    // traverse from the end
    const { id, env } = envStack[i];
    if (env.hasOwnProperty(varname)) {
      return { context: id, value: env[varname], name: varname };
    }
  }
  // not found
  return undefined;
}
