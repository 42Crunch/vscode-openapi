import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { CollectionsProvider } from "../explorer/provider";
import {
  CollectionNode,
  CollectionsNode,
  FilteredApiNode,
  FilteredCollectionNode,
} from "../explorer/nodes/collection";
import { ApiFilter, CollectionFilter } from "../types";
import { FavoriteCollectionNode, FilteredFavoriteApiNode } from "../explorer/nodes/favorite";

export default (store: PlatformStore, provider: CollectionsProvider) => ({
  apisFilter: (collection: CollectionNode) => apisFilter(store, provider, collection),
  favoriteApisFilter: (collection: FavoriteCollectionNode) =>
    favoriteApisFilter(store, provider, collection),
  collectionsFilter: (collections: CollectionsNode) =>
    collectionsFilter(store, provider, collections),

  collectionsFilterReset: async (node: FilteredCollectionNode) => {
    store.filters.collection = undefined;
    provider.refresh();
  },

  apisFilterReset: async (node: FilteredApiNode) => {
    store.filters.api.delete(node.getCollectionId());
    provider.refresh();
  },

  favoriteApisFilterReset: async (node: FilteredFavoriteApiNode) => {
    store.filters.favorite.delete(node.getCollectionId());
    provider.refresh();
  },

  loadMoreCollections: async (collections: CollectionsNode) => {
    store.limits.increaseCollections();
    provider.refresh();
  },

  loadMoreApis: async (collection: CollectionNode) => {
    store.limits.increaseApis(collection.getCollectionId());
    provider.refresh();
  },

  loadMoreFavoriteApis: async (collection: CollectionNode) => {
    store.limits.increaseFavorite(collection.getCollectionId());
    provider.refresh();
  },
});

async function collectionsFilter(
  store: PlatformStore,
  provider: CollectionsProvider,
  collections: CollectionsNode
) {
  const filter: CollectionFilter = { name: undefined, owner: "ALL" };

  const name = await vscode.window.showInputBox({
    prompt: "Filter Collections by Name",
  });

  if (name !== undefined) {
    if (name !== "") {
      filter.name = name;
      store.filters.collection = filter;
    } else {
      store.filters.collection = undefined;
    }
    provider.refresh();
  }
}

async function apisFilter(
  store: PlatformStore,
  provider: CollectionsProvider,
  collection: CollectionNode
) {
  const filter: ApiFilter = { name: undefined };

  const name = await vscode.window.showInputBox({
    prompt: "Filter APIs by Name",
  });

  if (name !== undefined) {
    if (name !== "") {
      filter.name = name;
      store.filters.api.set(collection.getCollectionId(), filter);
    } else {
      store.filters.api.delete(collection.getCollectionId());
    }
    provider.refresh();
  }
}

async function favoriteApisFilter(
  store: PlatformStore,
  provider: CollectionsProvider,
  collection: FavoriteCollectionNode
) {
  const filter: ApiFilter = { name: undefined };

  const name = await vscode.window.showInputBox({
    prompt: "Filter APIs by Name",
  });

  if (name !== undefined) {
    if (name !== "") {
      filter.name = name;
      store.filters.favorite.set(collection.getCollectionId(), filter);
    } else {
      store.filters.favorite.delete(collection.getCollectionId());
    }
    provider.refresh();
  }
}
