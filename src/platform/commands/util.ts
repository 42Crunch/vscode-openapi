import * as vscode from "vscode";
import { PlatformStore } from "../stores/platform-store";
import { configuration } from "../../configuration";
import { TagsWebView } from "../../webapps/views/tags/view";

export default (
  context: vscode.ExtensionContext,
  store: PlatformStore,
  tagsWebView: TagsWebView
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
});
