import * as vscode from "vscode";
import { PlatformStore } from "../stores/platform-store";
import { configuration } from "../../configuration";
import { TagsWebView } from "../../webapps/views/tags/view";
import { SignUpWebView, TokenType } from "../../webapps/signup/view";
import { configureCredentials, hasCredentials } from "../../credentials";

export default (
  secrets: vscode.SecretStorage,
  store: PlatformStore,
  tagsWebView: TagsWebView,
  signUpWebView: SignUpWebView
) => ({
  copyToClipboard: async (value: string, message: string) => {
    vscode.env.clipboard.writeText(value);
    const disposable = vscode.window.setStatusBarMessage(message);
    setTimeout(() => disposable.dispose(), 2000);
  },

  openInWebUI: async (node: any) => {
    const platformUrl = store.getConnection().platformUrl;
    if ("getApiId" in node) {
      const apiId = node.getApiId();
      const uri = vscode.Uri.parse(platformUrl + `/apis/${apiId}`);
      vscode.env.openExternal(uri);
    } else if ("getCollectionId" in node) {
      const collectionId = node.getCollectionId();
      const uri = vscode.Uri.parse(platformUrl + `/collections/${collectionId}`);
      vscode.env.openExternal(uri);
    }
  },

  setTags: async (uri: vscode.Uri) => {
    await tagsWebView.showTagsWebView(uri);
  },

  openSignUp: async () => {
    const credentials = await hasCredentials(configuration, secrets);
    if (credentials === undefined) {
      await configureCredentials(signUpWebView);
    } else {
      const response = await vscode.window.showInformationMessage(
        "Already registered, check Settings for details.",
        "Open Settings"
      );
      if (response === "Open Settings") {
        vscode.commands.executeCommand("openapi.showSettings");
      }
    }
  },
});
