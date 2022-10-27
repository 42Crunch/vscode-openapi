import * as vscode from "vscode";
import { Event, EventEmitter } from "vscode";
import { EnvData, NamedEnvironment } from "@xliic/common/env";

const ENV_DEFAULT_KEY = "openapi-42crunch.environment-default";
const ENV_SECRETS_KEY = "openapi-42crunch.environment-secrets";

export class EnvStore {
  private _onEnvironmentDidChange = new EventEmitter<NamedEnvironment>();
  constructor(private memento: vscode.Memento, private secret: vscode.SecretStorage) {}

  get onEnvironmentDidChange(): Event<NamedEnvironment> {
    return this._onEnvironmentDidChange.event;
  }

  async save(env: NamedEnvironment) {
    if (env.name === "default") {
      await this.memento.update(ENV_DEFAULT_KEY, env.environment);
    } else if (env.name === "secrets") {
      await this.secret.store(ENV_SECRETS_KEY, JSON.stringify(env.environment));
    }
    this._onEnvironmentDidChange.fire(env);
  }

  async all(): Promise<EnvData> {
    const defaultEnv = this.memento.get(ENV_DEFAULT_KEY, {});
    const secretsEnv = JSON.parse((await this.secret.get(ENV_SECRETS_KEY)) || "{}");
    return { default: defaultEnv, secrets: secretsEnv };
  }
}
