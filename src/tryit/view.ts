/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Preferences } from "@xliic/common/prefs";
import { HttpMethod } from "@xliic/openapi";
import { Webapp } from "@xliic/common/webapp/tryit";
import { Config } from "@xliic/common/config";

import { Bundle } from "../types";

import { WebView } from "../webapps/web-view";
import { executeHttpRequest } from "./http-handler";
import { executeCreateSchemaRequest } from "./create-schema-handler";
import { Cache } from "../cache";
import { EnvStore } from "../envstore";
import { extractSingleOperation } from "../util/extract";
import { loadConfig, saveConfig } from "../util/config";
import { Configuration } from "../configuration";

export type BundleDocumentVersions = Record<string, number>;

export type TryItTarget = {
  document: vscode.TextDocument;
  versions: BundleDocumentVersions;
  path: string;
  method: HttpMethod;
  preferredMediaType?: string;
  preferredBodyValue?: unknown;
};

export class TryItWebView extends WebView<Webapp> {
  private target?: TryItTarget;
  private bundle?: Bundle;

  constructor(
    extensionPath: string,
    private cache: Cache,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage
  ) {
    super(extensionPath, "tryit", "Try It", vscode.ViewColumn.Two);

    envStore.onEnvironmentDidChange((env) => {
      if (this.isActive()) {
        this.sendRequest({
          command: "loadEnv",
          payload: { default: undefined, secrets: undefined, [env.name]: env.environment },
        });
      }
    });

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    sendHttpRequest: executeHttpRequest,

    createSchema: async (response: any) => {
      if (this.target) {
        executeCreateSchemaRequest(this.target.document, this.cache, response);
      }
    },

    savePrefs: async (prefs: Preferences) => {
      if (this.target) {
        const uri = this.target.document.uri.toString();
        this.prefs[uri] = {
          ...this.prefs[uri],
          ...prefs,
        };
      }
    },

    showEnvWindow: async () => {
      vscode.commands.executeCommand("openapi.showEnvironment");
    },

    saveConfig: async (config: Config) => {
      await saveConfig(config, this.configuration, this.secrets);
    },
  };

  getTarget(): TryItTarget | undefined {
    return this.target;
  }

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    if (this.target && this.bundle) {
      await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
      const prefs = this.prefs[this.target.document.uri.toString()];
      if (prefs) {
        await this.sendRequest({ command: "loadPrefs", payload: prefs });
      }
      await this.sendLoadConfig();

      const oas = extractSingleOperation(
        this.target.method as HttpMethod,
        this.target.path,
        this.bundle.value
      );

      await this.sendRequest({
        command: "tryOperation",
        payload: {
          oas,
          ...this.target,
        },
      });
    }
  }

  async onDispose(): Promise<void> {
    this.target = undefined;
    await super.onDispose();
  }

  async showTryIt(bundle: Bundle, target: TryItTarget) {
    this.target = target;
    this.bundle = bundle;
    await this.show();
  }

  async updateTryIt(bundle: Bundle, versions: BundleDocumentVersions) {
    if (!this.target) {
      return;
    }

    this.target = { ...this.target, versions };

    const oas = extractSingleOperation(this.target.method, this.target.path, bundle.value);

    return this.sendRequest({
      command: "tryOperation",
      payload: {
        oas,
        ...this.target,
      },
    });
  }

  async sendLoadConfig() {
    const config = await loadConfig(this.configuration, this.secrets);
    this.sendRequest({
      command: "loadConfig",
      payload: config,
    });
  }
}
