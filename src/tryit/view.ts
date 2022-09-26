/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { OasWithOperation, TryItRequest, TryItResponse } from "@xliic/common/messages/tryit";
import { EnvRequest, EnvResponse, NamedEnvironment } from "@xliic/common/messages/env";
import { Preferences, PrefRequest, PrefResponse } from "@xliic/common/messages/prefs";

import { WebView } from "../web-view";
import { executeHttpRequest } from "./http-handler";
import { executeCreateSchemaRequest } from "./create-schema-handler";
import { Cache } from "../cache";

const ENV_DEFAULT_KEY = "openapi-42crunch.environment-default";
const ENV_SECRETS_KEY = "openapi-42crunch.environment-secrets";

export class TryItWebView extends WebView<
  TryItRequest | EnvRequest | PrefRequest,
  TryItResponse | EnvResponse | PrefResponse
> {
  private document?: vscode.TextDocument;
  responseHandlers = {
    sendRequest: executeHttpRequest,
    createSchema: async (response: any) => {
      executeCreateSchemaRequest(this.document!, this.cache, response);
    },
    saveConfig: async (config: any) => {
      vscode.workspace
        .getConfiguration("openapi")
        .update("tryit.insecureSslHostnames", config.insecureSslHostnames);
    },
    saveEnv: async (env: NamedEnvironment) => {
      if (env.name === "default") {
        this.memento.update(ENV_DEFAULT_KEY, env.environment);
      } else if (env.name === "secrets") {
        this.secret.store(ENV_SECRETS_KEY, JSON.stringify(env.environment));
      }
    },
    savePrefs: async (prefs: Preferences) => {
      this.prefs[this.document!.uri.toString()] = prefs;
    },
  };

  constructor(
    extensionPath: string,
    private cache: Cache,
    private memento: vscode.Memento,
    private secret: vscode.SecretStorage,
    private prefs: Record<string, Preferences>
  ) {
    super(extensionPath, "scan", "Try It", vscode.ViewColumn.Two);
  }

  async sendTryOperation(document: vscode.TextDocument, payload: OasWithOperation) {
    this.document = document;

    const defaultEnv = this.memento.get(ENV_DEFAULT_KEY, {});
    const secretsEnv = JSON.parse((await this.secret.get(ENV_SECRETS_KEY)) || "{}");
    this.sendRequest({ command: "loadEnv", payload: { default: defaultEnv, secrets: secretsEnv } });

    const prefs = this.prefs[this.document.uri.toString()];
    if (prefs) {
      this.sendRequest({ command: "loadPrefs", payload: prefs });
    }
    return this.sendRequest({ command: "tryOperation", payload });
  }
}
