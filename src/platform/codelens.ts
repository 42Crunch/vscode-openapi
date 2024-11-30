import * as vscode from "vscode";
import { PlatformStore } from "./stores/platform-store";
import { getApiId } from "./util";
import { Cache } from "../cache";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";
import { TagData, TAGS_DATA_KEY } from "@xliic/common/tags";
import { hasCredentials } from "../credentials";
import { Configuration } from "../configuration";

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

export class PlatformTagCodelensProvider implements vscode.CodeLensProvider<TagsLens> {
  onDidChangeCodeLenses?: vscode.Event<void>;

  constructor(
    private cache: Cache,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private memento: vscode.Memento
  ) {}

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<TagsLens[]> {
    const credentials = await hasCredentials(this.configuration, this.secrets);
    if (credentials === "api-token") {
      const parsed = this.cache.getParsedDocument(document);
      const version = getOpenApiVersion(parsed);
      if (parsed && version !== OpenApiVersion.Unknown) {
        return [new TagsLens(document.uri)];
      }
    }
    return [];
  }

  async resolveCodeLens(codeLens: TagsLens, token: vscode.CancellationToken): Promise<TagsLens> {
    const targetFileName = codeLens.uri?.fsPath;
    if (targetFileName) {
      const selectedTagNames: string[] = [];
      const tagsData = this.memento.get(TAGS_DATA_KEY, {}) as TagData;
      let title;
      let tooltip;
      const data = tagsData[targetFileName];
      if (data) {
        if (Array.isArray(data)) {
          data.forEach((tagEntry) =>
            selectedTagNames.push(`${tagEntry.categoryName}: ${tagEntry.tagName}`)
          );
          title = `Tags: ${selectedTagNames.length} selected`;
          tooltip = selectedTagNames.length > 0 ? "Tags: " + `${selectedTagNames.join(", ")}` : "";
        } else {
          title = `Tags: linked to API`;
          tooltip =
            "Linked to API " + `${data.apiName}` + " in collection " + `${data.collectionName}`;
        }
      } else {
        title = "Tags: 0 selected";
        tooltip = "No tags selected";
      }
      codeLens.command = {
        title,
        tooltip,
        command: "openapi.platform.setTags",
        arguments: [codeLens.uri],
      };
    }
    return codeLens;
  }
}

class TagsLens extends vscode.CodeLens {
  constructor(public uri: vscode.Uri) {
    super(new vscode.Range(0, 1, 0, 1024));
  }
}
