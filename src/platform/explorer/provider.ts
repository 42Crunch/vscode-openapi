import * as vscode from "vscode";
import { PlatformStore } from "../stores/platform-store";
import { FavoritesStore } from "../stores/favorites-store";
import { makeIcon } from "../util";
import { RootNode } from "./nodes/root";
import { ExplorerNode } from "./nodes/base";

export class CollectionsProvider implements vscode.TreeDataProvider<ExplorerNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  public readonly root: RootNode;

  constructor(
    private store: PlatformStore,
    favoritesStore: FavoritesStore,
    private extensionUri: vscode.Uri
  ) {
    this.root = new RootNode(store, favoritesStore);
  }

  getParent?(element: ExplorerNode): vscode.ProviderResult<ExplorerNode> {
    return element?.parent;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(node: ExplorerNode): vscode.TreeItem | Promise<vscode.TreeItem> {
    const item = node.item;
    if (item) {
      item.id = node.id;
      item.contextValue = node.contextValue;
      if (node.icon) {
        item.iconPath = makeIcon(this.extensionUri, node.icon);
      }
    }
    return item;
  }

  async getChildren(node?: ExplorerNode): Promise<ExplorerNode[]> {
    if (node) {
      return node.getChildren();
    }
    return this.root.getChildren();
  }
}
