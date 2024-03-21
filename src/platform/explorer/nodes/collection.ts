import * as vscode from "vscode";
import { PlatformStore } from "../../stores/platform-store";
import { CollectionData } from "../../types";
import { ApiNode } from "./api";
import { AbstractExplorerNode, ExplorerNode } from "./base";
import { LoadMoreApisNode, LoadMoreCollectionsNode } from "./load-more";

export class CollectionsNode extends AbstractExplorerNode {
  constructor(parent: ExplorerNode, private store: PlatformStore) {
    super(
      parent,
      `${parent.id}-collections`,
      "API Collections",
      vscode.TreeItemCollapsibleState.Expanded
    );
    this.contextValue = "collections";
  }

  async getChildren(): Promise<ExplorerNode[]> {
    const view = await this.store.getCollections(
      this.store.filters.collection,
      this.store.limits.getCollections()
    );

    const children = view.collections.map(
      (collection) => new CollectionNode(this.store, this, collection)
    );

    const hasFilter = this.store.filters.collection
      ? [new FilteredCollectionNode(this, this.store, view.collections.length)]
      : [];

    const more = view.hasMore ? [new LoadMoreCollectionsNode(this)] : [];

    return [...hasFilter, ...children, ...more];
  }
}

export class FilteredCollectionNode extends AbstractExplorerNode {
  constructor(readonly parent: CollectionsNode, private store: PlatformStore, found: number) {
    super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
    this.icon = "filter";
    this.contextValue = "collectionFilter";
  }
}

export class CollectionNode extends AbstractExplorerNode {
  constructor(
    private store: PlatformStore,
    parent: CollectionsNode,
    readonly collection: CollectionData
  ) {
    super(
      parent,
      `${parent.id}-${collection.desc.id}`,
      getCollectionTitle(store, collection.desc),
      collection.summary.apis === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    const writable = this.collection.summary.writeApis;
    this.icon = writable ? "file-directory" : { light: "folder-locked", dark: "folder-locked" };
    this.contextValue = "collection";
  }

  async getChildren(): Promise<ExplorerNode[]> {
    const apis = await this.store.getApis(
      this.getCollectionId(),
      this.store.filters.api.get(this.getCollectionId()),
      this.store.limits.getApis(this.getCollectionId())
    );
    const children = apis.apis.map((api) => new ApiNode(this, this.store, api));
    const hasMore = apis.hasMore ? [new LoadMoreApisNode(this)] : [];

    const hasFilter = this.store.filters.api.has(this.getCollectionId())
      ? [new FilteredApiNode(this, this.store, apis.apis.length)]
      : [];

    return [...hasFilter, ...children, ...hasMore];
  }

  public getCollectionId(): string {
    return this.collection.desc.id;
  }

  public getCollectionTechnicalName(): string {
    return this.collection.desc.technicalName;
  }
}

export class FilteredApiNode extends AbstractExplorerNode {
  constructor(readonly parent: CollectionNode, private store: PlatformStore, found: number) {
    super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
    this.icon = "filter";
    this.contextValue = "apiFilter";
  }

  getCollectionId() {
    return this.parent.getCollectionId();
  }
}

function getCollectionTitle(store: PlatformStore, desc: any): string {
  return desc.name;
}
