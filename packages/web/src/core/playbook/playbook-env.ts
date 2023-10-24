import { Environment } from "@xliic/common/env";

export type PlaybookVariableSuccessfullAssignment = {
  name: string;
  value: unknown;
  error: undefined;
};

export type PlaybookVariableFailedAssignment = {
  name: string;
  error: string;
  value: undefined;
};

export type PlaybookVariableAssignment =
  | PlaybookVariableSuccessfullAssignment
  | PlaybookVariableFailedAssignment;

export type PlaybookEnv = {
  id: string;
  env: Environment;
  assignments: PlaybookVariableAssignments;
};
export type PlaybookVariableAssignments = PlaybookVariableAssignment[];

export type PlaybookEnvStack = PlaybookEnv[];

export type EnvStackLookupResult = { context: string; value: unknown; name: string };

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
