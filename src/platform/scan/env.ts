import * as vscode from "vscode";
import { EnvData, NamedEnvironment } from "@xliic/common/messages/env";

const ENV_DEFAULT_KEY = "openapi-42crunch.environment-default";
const ENV_SECRETS_KEY = "openapi-42crunch.environment-secrets";

export async function loadEnv(
  memento: vscode.Memento,
  secret: vscode.SecretStorage
): Promise<EnvData> {
  const defaultEnv = memento.get(ENV_DEFAULT_KEY, {});
  const secretsEnv = JSON.parse((await secret.get(ENV_SECRETS_KEY)) || "{}");
  return { default: defaultEnv, secrets: secretsEnv };
}

export async function saveEnv(
  memento: vscode.Memento,
  secret: vscode.SecretStorage,
  env: NamedEnvironment
): Promise<void> {
  if (env.name === "default") {
    memento.update(ENV_DEFAULT_KEY, env.environment);
  } else if (env.name === "secrets") {
    secret.store(ENV_SECRETS_KEY, JSON.stringify(env.environment));
  }
}
