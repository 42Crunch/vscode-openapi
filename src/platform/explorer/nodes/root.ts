import * as vscode from "vscode";
import { FavoritesStore } from "../../stores/favorites-store";
import { PlatformStore } from "../../stores/platform-store";
import { AbstractExplorerNode, ExplorerNode } from "./base";
import { CollectionsNode } from "./collection";
import { FavoriteCollectionsNode } from "./favorite";

export class RootNode implements ExplorerNode {
  readonly favorite: FavoriteCollectionsNode;
  readonly collections: CollectionsNode;
  readonly dictionaries: DataDictionariesNode;
  readonly id = "root";
  readonly parent = undefined;
  readonly item: vscode.TreeItem;

  constructor(private store: PlatformStore, private favorites: FavoritesStore) {
    this.favorite = new FavoriteCollectionsNode(this, this.store, this.favorites);
    this.collections = new CollectionsNode(this, this.store);
    this.dictionaries = new DataDictionariesNode(this, this.store);
    this.item = {};
  }

  async getChildren(): Promise<ExplorerNode[]> {
    return [this.favorite, this.dictionaries, this.collections];
  }
}

export class DataDictionariesNode extends AbstractExplorerNode {
  constructor(parent: ExplorerNode, private store: PlatformStore) {
    super(
      parent,
      `${parent.id}-data-dictionaries`,
      "Data Dictionaries",
      vscode.TreeItemCollapsibleState.None
    );
    this.item.command = {
      command: "openapi.platform.browseDataDictionaries",
      title: "",
    };
  }
}
