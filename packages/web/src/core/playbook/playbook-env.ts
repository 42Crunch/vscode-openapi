import { Environment } from "@xliic/common/env";

export type PlaybookVariableAssignment = {
  name: string;
  value?: unknown;
  error?: string;
};

export type PlaybookEnv = {
  id: string;
  env: Environment;
  assignments: PlaybookVariableAssignments;
};
export type PlaybookVariableAssignments = PlaybookVariableAssignment[];

export type PlaybookEnvStack = PlaybookEnv[];

export function lookup(
  envStack: PlaybookEnvStack,
  varname: string
): { context: string; value: unknown; name: string } | undefined {
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
