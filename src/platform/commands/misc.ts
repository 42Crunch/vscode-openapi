import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { CollectionsProvider } from "../explorer/provider";
import { ExplorerNode } from "../explorer/nodes/base";
import {
  confirmed,
  createCollectionNamingConventionInputBoxOptions,
  getApiId,
  makePlatformUri,
} from "../util";
import { ApiNode } from "../explorer/nodes/api";
import { FavoritesStore } from "../stores/favorites-store";
import { CollectionNode } from "../explorer/nodes/collection";
import { FavoriteCollectionNode } from "../explorer/nodes/favorite";

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
    const convention = await store.getCollectionNamingConvention();
    const name = await vscode.window.showInputBox({
      title: "Rename collection",
      value: collection.collection.desc.name,
      ...createCollectionNamingConventionInputBoxOptions(convention),
    });
    if (name) {
      await store.collectionRename(collection.getCollectionId(), name);
      provider.refresh();
    }
  },

  apiRename: async (api: ApiNode) => {
    const convention = await store.getCollectionNamingConvention();
    const name = await vscode.window.showInputBox({
      title: "Rename API",
      value: api.api.desc.name,
      ...createCollectionNamingConventionInputBoxOptions(convention),
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
    const convention = await store.getCollectionNamingConvention();
    const name = await vscode.window.showInputBox({
      title: "Create new collection",
      placeHolder: "New collection name",
      ...createCollectionNamingConventionInputBoxOptions(convention),
    });

    if (name) {
      const collection = await store.createCollection(name);
      const collectionNode = new CollectionNode(store, provider.root.collections, collection);
      provider.refresh();
      tree.reveal(collectionNode, { focus: true });
    }
  },

  refreshCollections: async () => {
    await store.refresh();
    provider.refresh();
  },

  editApi: async (apiId: string) => {
    const uri = makePlatformUri(apiId);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  },

  openFile: async (rootPath: string, technicalName: string) => {
    const uri = vscode.Uri.file(`${rootPath}/${technicalName}`);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  },
});
