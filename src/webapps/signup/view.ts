/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/signup";
import { Configuration } from "../../configuration";
import { WebView } from "../web-view";
import { PlatformStore } from "../../platform/stores/platform-store";
import { Logger } from "../../platform/types";
import { requestToken } from "../../audit/client";
import { AnondCredentials, PlatformCredentials } from "@xliic/common/signup";
import { delay } from "../../time-util";

export type TokenType = "anond-token" | "api-token" | undefined;

export class SignUpWebView extends WebView<Webapp> {
  private resolve: ((value: TokenType) => void) | undefined;

  constructor(
    extensionPath: string,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private platform: PlatformStore,
    private logger: Logger
  ) {
    super(extensionPath, "signup", "Sign Up", vscode.ViewColumn.One);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    requestAnondTokenByEmail: async (email: string) => {
      try {
        await requestToken(email);
        this.sendRequest({
          command: "showAnondTokenResponse",
          payload: {
            success: true,
          },
        });
      } catch (e) {
        this.sendRequest({
          command: "showAnondTokenResponse",
          payload: {
            success: false,
            message: "Unexpected error when trying to request token: " + e,
          },
        });
      }
    },
    anondSignUpComplete: async (anondCredentials: AnondCredentials) => {
      await this.configuration.update(
        "securityAuditToken",
        anondCredentials.anondToken,
        vscode.ConfigurationTarget.Global
      );
      await this.configuration.update(
        "platformAuthType",
        "anond-token",
        vscode.ConfigurationTarget.Global
      );
      await delay(3000);
      this.close("anond-token");
    },

    platformSignUpComplete: async (platformCredentials: PlatformCredentials) => {
      const credentials = {
        platformUrl: platformCredentials.platformUrl,
        apiToken: platformCredentials.platformApiToken,
        services: "",
      };
      const result = await this.platform.testConnection(credentials);
      if (result.success) {
        await this.configuration.update(
          "platformUrl",
          platformCredentials.platformUrl,
          vscode.ConfigurationTarget.Global
        );
        await this.secrets.store("platformApiToken", platformCredentials.platformApiToken);
        await this.configuration.update(
          "platformAuthType",
          "api-token",
          vscode.ConfigurationTarget.Global
        );
        await delay(3000);
        this.close("api-token");
      } else {
        this.sendRequest({
          command: "showPlatformConnectionTestError",
          payload: {
            error: result.message,
          },
        });
      }
    },
    openLink: async (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
  }

  async showSignUp(resolve: (value: TokenType) => void) {
    this.resolve = resolve;
    await this.show();
  }

  close(value: TokenType) {
    if (this.resolve) {
      this.resolve(value);
    }
    this.resolve = undefined;
    // Event onDispose will be fired
    this.dispose();
  }

  async onDispose(): Promise<void> {
    if (this.resolve) {
      // User closed this panel manually
      this.resolve(undefined);
    }
    this.resolve = undefined;
    await super.onDispose();
  }
}
