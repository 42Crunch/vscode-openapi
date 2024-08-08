/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { NamedEnvironment } from "@xliic/common/env";

import { Webapp } from "@xliic/common/webapp/environment";

import { WebView } from "../webapps/web-view";
import { EnvStore } from "../envstore";

export class EnvironmentWebView extends WebView<Webapp> {
  hostHandlers: Webapp["hostHandlers"] = {
    saveEnv: async (env: NamedEnvironment) => {
      this.envStore.save(env);
    },
  };

  constructor(extensionPath: string, private envStore: EnvStore) {
    super(extensionPath, "environment", "Environment", vscode.ViewColumn.Two);
    envStore.onEnvironmentDidChange((env) => {
      if (this.isActive()) {
        this.sendRequest({
          command: "loadEnv",
          payload: { default: undefined, secrets: undefined, [env.name]: env.environment },
        });
      }
    });
  }

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
  }

  async showEnvironment() {
    await this.show();
  }
}
