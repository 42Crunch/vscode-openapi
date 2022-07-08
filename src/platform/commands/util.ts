import * as vscode from "vscode";
import { PlatformContext } from "../types";

export default (context: vscode.ExtensionContext, platformContext: PlatformContext) => ({
  copyToClipboard: async (value: string, message: string) => {
    vscode.env.clipboard.writeText(value);
    const disposable = vscode.window.setStatusBarMessage(message);
    setTimeout(() => disposable.dispose(), 2000);
  },

  openInWebUI: async (node: any) => {
    if ("getApiId" in node) {
      const apiId = node.getApiId();
      const uri = vscode.Uri.parse(platformContext.connection.platformUrl + `/apis/${apiId}`);
      vscode.env.openExternal(uri);
    } else if ("getCollectionId" in node) {
      const collectionId = node.getCollectionId();
      const uri = vscode.Uri.parse(
        platformContext.connection.platformUrl + `/collections/${collectionId}`
      );
      vscode.env.openExternal(uri);
    }
  },

  updatePlatformCredentials: async () => {
    const platform = await vscode.window.showInputBox({
      prompt: "Enter 42Crunch platform URL",
      placeHolder: "platform url",
      value: "https://platform.42crunch.com/",
      ignoreFocusOut: true,
      validateInput: (input) => {
        try {
          const url = vscode.Uri.parse(input, true);
          if (url.scheme !== "https") {
            return 'URL scheme must be "https"';
          }
          if (!url.authority) {
            return "URL authority must not be empty";
          }
          if (url.path != "/") {
            return "URL path must be empty";
          }
        } catch (ex) {
          return `${ex}`;
        }
      },
    });

    if (platform === undefined) {
      return;
    }

    const UUID_REGEX =
      /^(ide_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const token = await vscode.window.showInputBox({
      prompt: "Enter 42Crunch API token",
      placeHolder: "API Token",
      ignoreFocusOut: true,
      validateInput: (input) => {
        if (!input || !input.match(UUID_REGEX)) {
          return "Must be a valid API Token";
        }
      },
    });

    if (token === undefined) {
      return;
    }

    const platformUrl = vscode.Uri.parse(platform).toString();

    platformContext.connection.platformUrl = platformUrl;
    platformContext.connection.apiToken = token;

    vscode.workspace
      .getConfiguration()
      .update("openapi.platformUrl", platformUrl, vscode.ConfigurationTarget.Global);
    await context.secrets.store("platformApiToken", token);

    await vscode.commands.executeCommand("setContext", "openapi.platform.credentials", "present");
  },
});
