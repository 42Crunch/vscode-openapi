import * as vscode from "vscode";
import { PlatformStore } from "./stores/platform-store";
import { getApiId } from "./util";
import { Cache } from "../cache";
import { getOpenApiVersion } from "../parsers";
import { OpenApiVersion } from "../types";
import { getApiConfig } from "./config";
import { Configuration } from "../configuration";
import { getMandatoryTags } from "./mandatory-tags";

export class PlatformApiCodelensProvider implements vscode.CodeLensProvider {
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

  constructor(private configuration: Configuration, private cache: Cache) {}

  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): TagsLens[] {
    const parsed = this.cache.getParsedDocument(document);
    const version = getOpenApiVersion(parsed);
    if (parsed && version !== OpenApiVersion.Unknown) {
      return [new TagsLens(document)];
    }
    return [];
  }

  async resolveCodeLens(codeLens: TagsLens, token: vscode.CancellationToken): Promise<TagsLens> {
    const mandatoryTags = getMandatoryTags(this.configuration);
    const config = await getApiConfig(codeLens.document.uri);
    const tags = [...mandatoryTags, ...(config?.tags || [])];
    const formatted = tags ? `: ${tags.join(", ")}` : "";
    const MAX_FORMATTED_TAGS_LENGTH = 40;
    // add mandatory
    codeLens.command = {
      title:
        `Tags` + (formatted.length > MAX_FORMATTED_TAGS_LENGTH ? `: (${tags?.length})` : formatted),
      tooltip: "42Crunch platform tags",
      command: "openapi.platform.updateTags",
      arguments: [codeLens.document],
    };

    return codeLens;
  }
}

class TagsLens extends vscode.CodeLens {
  constructor(public document: vscode.TextDocument) {
    super(new vscode.Range(0, 1, 0, 1024));
  }
}
