import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { CollectionsProvider } from "../explorer/provider";
import { ExplorerNode } from "../nodes/base";
import { confirmed, getApiId, makePlatformUri } from "../util";
import { ApiNode } from "../nodes/api";
import { FavoritesStore } from "../stores/favorites-store";
import { CollectionNode } from "../nodes/collection";
import { FavoriteCollectionNode } from "../nodes/favorite";

export default (
  store: PlatformStore,
  favorites: FavoritesStore,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>
) => ({
  deleteApi: async (api: ApiNode) => {
    if (await confirmed("Are you sure you want to delete the selected API")) {
      const apiId = api.getApiId();
      for (const document of vscode.workspace.textDocuments) {
        if (getApiId(document.uri) === apiId) {
          await vscode.window.showTextDocument(document, { preserveFocus: false });
          await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        }
      }
      await store.deleteApi(apiId);
      provider.refresh();
    }
  },

  collectionsFilterReset: async () => {
    store.setCollectionsFilter(undefined);
    provider.refresh();
  },

  collectionAddToFavorite: async (collection: CollectionNode) => {
    favorites.addFavoriteCollection(collection.getCollectionId());
    provider.refresh();
  },

  collectionRemoveFromFavorite: async (collection: FavoriteCollectionNode) => {
    if (await confirmed("Are you sure you want to remove selected collection from Favorite?")) {
      favorites.removeFavoriteCollection(collection.getCollectionId());
      provider.refresh();
    }
  },

  collectionRename: async (collection: CollectionNode | FavoriteCollectionNode) => {
    const name = await vscode.window.showInputBox({
      prompt: "New collection name",
      value: collection.collection.desc.name,
      validateInput: (input) => {
        if (!input.match(/^[A-Za-z0-9_\-\.\ ]+$/)) {
          return "Invalid name, only alphanumerical characters are allowed";
        }
      },
    });
    if (name) {
      await store.collectionRename(collection.getCollectionId(), name);
      provider.refresh();
    }
  },

  apiRename: async (api: ApiNode) => {
    const name = await vscode.window.showInputBox({
      prompt: "New API name",
      value: api.api.desc.name,
      validateInput: (input) => {
        if (!input.match(/^[A-Za-z0-9_\-\.\ ]+$/)) {
          return "Invalid name, only alphanumerical characters are allowed";
        }
      },
    });
    if (name) {
      await store.apiRename(api.getApiId(), name);
      provider.refresh();
    }
  },

  deleteCollection: async (collection: CollectionNode) => {
    if (collection.collection.summary.apis > 0) {
      await vscode.window.showWarningMessage(
        "This collection is not empty, please remove all APIs in the collection first."
      );
      return;
    }
    if (await confirmed("Are you sure you want to delete the selected collection?")) {
      await store.deleteCollection(collection.getCollectionId());
      provider.refresh();
    }
  },

  focusApi: async (collectionId: string, apiId: string) => {
    const collection = await store.getCollection(collectionId);
    const api = await store.getApi(apiId);
    const collectionNode = new CollectionNode(store, provider.root.collections, collection);
    const apiNode = new ApiNode(collectionNode, store, api);
    tree.reveal(apiNode, { focus: true });
  },

  focusCollection: async (collectionId: string) => {
    const collection = await store.getCollection(collectionId);
    const collectionNode = new CollectionNode(store, provider.root.collections, collection);
    tree.reveal(collectionNode, { focus: true });
  },

  createCollection: async () => {
    const name = await vscode.window.showInputBox({
      prompt: "New Collection name",
    });
    const collection = await store.createCollection(name);
    const collectionNode = new CollectionNode(store, provider.root.collections, collection);
    provider.refresh();
    tree.reveal(collectionNode, { focus: true });
  },

  refreshCollections: async () => {
    provider.refresh();
  },

  loadMoreCollections: async () => {
    store.increaseCollectionsLimit();
    provider.refresh();
  },

  loadMoreApis: async (apiId: string) => {
    store.increaseApiLimit(apiId);
    provider.refresh();
  },

  editApi: async (apiId: string) => {
    const uri = makePlatformUri(apiId);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  },
});
