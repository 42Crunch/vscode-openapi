import * as vscode from "vscode";
import { AbstractExplorerNode, ExplorerNode } from "./base";
import { CollectionNode, CollectionsNode } from "./collection";
import { FavoriteCollectionNode } from "./favorite";

export class LoadMoreCollectionsNode extends AbstractExplorerNode {
  constructor(parent: CollectionsNode) {
    super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
    this.icon = "refresh";
    this.item.command = {
      command: "openapi.platform.loadMoreCollections",
      title: "",
      arguments: [parent],
    };
  }
}

export class LoadMoreApisNode extends AbstractExplorerNode {
  constructor(readonly parent: CollectionNode | FavoriteCollectionNode) {
    super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
    this.icon = "refresh";
    this.item.command = {
      command: "openapi.platform.loadMoreApis",
      title: "",
      arguments: [parent],
    };
  }
}

export class LoadMoreFavoriteApisNode extends AbstractExplorerNode {
  constructor(readonly parent: CollectionNode | FavoriteCollectionNode) {
    super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
    this.icon = "refresh";
    this.item.command = {
      command: "openapi.platform.loadMoreFavoriteApis",
      title: "",
      arguments: [parent],
    };
  }
}
