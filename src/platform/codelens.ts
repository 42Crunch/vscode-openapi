import * as vscode from "vscode";
import { PlatformStore } from "./stores/platform-store";
import { getApiId } from "./util";

export class CodelensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void>;
  constructor(private store: PlatformStore) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const apiId = getApiId(document.uri)!;
    const api = await this.store.getApi(apiId);
    const collection = await this.store.getCollection(api.desc.cid);

    const collectionLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
      title: `${collection.desc.name}`,
      tooltip: "Collection name",
      command: "openapi.platform.focusCollection",
      arguments: [collection.desc.id],
    });

    const apiLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
      title: `${api.desc.name}`,
      tooltip: "API name",
      command: "openapi.platform.focusApi",
      arguments: [collection.desc.id, api.desc.id],
    });

    const uuidLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
      title: `${api.desc.id}`,
      tooltip: "API UUID",
      command: "openapi.platform.copyToClipboard",
      arguments: [api.desc.id, `Copied UUID ${api.desc.id} to clipboard`],
    });

    return [collectionLens, apiLens, uuidLens];
  }
}
