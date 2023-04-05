/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Preferences } from "@xliic/common/prefs";
import { HttpMethod } from "@xliic/common/http";
import { Webapp } from "@xliic/common/webapp/tryit";

import { Bundle } from "../types";

import { WebView } from "../web-view";
import { executeHttpRequest } from "./http-handler";
import { executeCreateSchemaRequest } from "./create-schema-handler";
import { Cache } from "../cache";
import { EnvStore } from "../envstore";
import { extractSingleOperation } from "../util/extract";

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
  constructor(
    extensionPath: string,
    private cache: Cache,
    private envStore: EnvStore,
    private prefs: Record<string, Preferences>
  ) {
    super(extensionPath, "tryit", "Try It", vscode.ViewColumn.Two, false);

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

    saveConfig: async (config: any) => {
      vscode.workspace
        .getConfiguration("openapi")
        .update("tryit.insecureSslHostnames", config.insecureSslHostnames);
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
  };

  getTarget(): TryItTarget | undefined {
    return this.target;
  }

  onDispose(): void {
    this.target = undefined;
    super.onDispose();
  }

  async showTryIt(bundle: Bundle, target: TryItTarget) {
    this.target = target;

    await this.show();
    await this.sendColorTheme(vscode.window.activeColorTheme);
    await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
    const prefs = this.prefs[this.target.document.uri.toString()];
    if (prefs) {
      await this.sendRequest({ command: "loadPrefs", payload: prefs });
    }

    const insecureSslHostnames =
      vscode.workspace.getConfiguration("openapi").get<string[]>("tryit.insecureSslHostnames") ||
      [];

    const oas = extractSingleOperation(target.method as HttpMethod, target.path, bundle.value);

    return this.sendRequest({
      command: "tryOperation",
      payload: {
        oas,
        config: {
          insecureSslHostnames,
        },
        ...target,
      },
    });
  }

  async updateTryIt(bundle: Bundle, versions: BundleDocumentVersions) {
    if (!this.target) {
      return;
    }

    this.target = { ...this.target, versions };

    const oas = extractSingleOperation(this.target.method, this.target.path, bundle.value);

    const insecureSslHostnames =
      vscode.workspace.getConfiguration("openapi").get<string[]>("tryit.insecureSslHostnames") ||
      [];

    return this.sendRequest({
      command: "tryOperation",
      payload: {
        oas,
        config: {
          insecureSslHostnames,
        },
        ...this.target,
      },
    });
  }
}
