import * as vscode from "vscode";
import { FavoritesStore } from "../../stores/favorites-store";
import { PlatformStore } from "../../stores/platform-store";
import { CollectionData } from "../../types";
import { ApiNode } from "./api";
import { AbstractExplorerNode, ExplorerNode } from "./base";
import { LoadMoreFavoriteApisNode } from "./load-more";

export class FavoriteCollectionsNode extends AbstractExplorerNode {
  constructor(
    parent: ExplorerNode,
    private store: PlatformStore,
    private favoritesStore: FavoritesStore
  ) {
    super(
      parent,
      `${parent.id}-favorite`,
      "My Favorite Collections",
      vscode.TreeItemCollapsibleState.Expanded
    );
    this.contextValue = "favorite";
  }

  async getChildren(): Promise<ExplorerNode[]> {
    const favorites = this.favoritesStore.getFavoriteCollectionIds();
    const collections = await this.store.getAllCollections();
    const children = collections
      .filter((collection) => favorites.includes(collection.desc.id))
      .map((collection) => new FavoriteCollectionNode(this, this.store, collection));
    return children;
  }
}

export class FavoriteCollectionNode extends AbstractExplorerNode {
  constructor(
    parent: ExplorerNode,
    private store: PlatformStore,
    readonly collection: CollectionData
  ) {
    super(
      parent,
      `${parent.id}-${collection.desc.id}`,
      collection.desc.name,
      collection.summary.apis === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.icon = "file-directory";
    this.contextValue = "favoriteCollection";
  }

  async getChildren(): Promise<ExplorerNode[]> {
    const apis = await this.store.getApis(
      this.getCollectionId(),
      this.store.filters.favorite.get(this.getCollectionId()),
      this.store.limits.getFavorite(this.getCollectionId())
    );
    const children = apis.apis.map((api) => new ApiNode(this, this.store, api));
    const hasMore = apis.hasMore ? [new LoadMoreFavoriteApisNode(this)] : [];

    const hasFilter = this.store.filters.favorite.has(this.getCollectionId())
      ? [new FilteredFavoriteApiNode(this, this.store, apis.apis.length)]
      : [];

    return [...hasFilter, ...children, ...hasMore];
  }

  getCollectionId(): string {
    return this.collection.desc.id;
  }
}

export class FilteredFavoriteApiNode extends AbstractExplorerNode {
  constructor(
    readonly parent: FavoriteCollectionNode,
    private store: PlatformStore,
    found: number
  ) {
    super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
    this.icon = "filter";
    this.contextValue = "favoriteApiFilter";
  }

  getCollectionId() {
    return this.parent.getCollectionId();
  }
}
