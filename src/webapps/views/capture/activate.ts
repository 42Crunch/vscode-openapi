/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Configuration } from "../../../configuration";
import { CaptureWebView } from "./view";
import { PlatformStore } from "../../../platform/stores/platform-store";
import { Logger } from "../../../platform/types";
import { ensureHasCredentials } from "../../../credentials";
import { SignUpWebView } from "../../signup/view";

export function activate(
  context: vscode.ExtensionContext,
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  platform: PlatformStore,
  logger: Logger,
  signUpWebView: SignUpWebView
) {
  const view = new CaptureWebView(context.extensionPath, configuration, secrets, logger);

  vscode.commands.registerCommand("openapi.showCapture", async () => {
    if (!(await ensureHasCredentials(signUpWebView, configuration, secrets, "capture"))) {
      return;
    }

    await view.showCaptureWebView();
  });
}
