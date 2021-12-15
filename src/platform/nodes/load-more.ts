import * as vscode from "vscode";
import { AbstractExplorerNode, ExplorerNode } from "./base";
import { CollectionNode } from "./collection";
import { FavoriteCollectionNode } from "./favorite";

export class LoadMoreCollectionsNode extends AbstractExplorerNode {
  constructor(parent: ExplorerNode) {
    super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
    this.icon = "refresh";
    this.item.command = { command: "openapi.platform.loadMoreCollections", title: "" };
  }
}

export class LoadMoreApisNode extends AbstractExplorerNode {
  constructor(readonly parent: CollectionNode | FavoriteCollectionNode) {
    super(parent, `${parent.id}-load-more`, "Load More...  ", vscode.TreeItemCollapsibleState.None);
    this.icon = "refresh";
    this.item.command = {
      command: "openapi.platform.loadMoreApis",
      title: "",
      arguments: [this.parent.getCollectionId()],
    };
  }
}
