import * as vscode from "vscode";

export interface ExplorerNode {
  readonly parent: ExplorerNode | undefined;
  readonly id: string;
  readonly item: vscode.TreeItem;
  readonly icon?: { dark: string; light: string } | string | undefined;
  readonly contextValue?: string;
  getChildren(): Promise<ExplorerNode[]>;
}

export abstract class AbstractExplorerNode implements ExplorerNode {
  readonly item: vscode.TreeItem;
  icon: { dark: string; light: string } | string | undefined;
  contextValue: string | undefined;

  constructor(
    readonly parent: ExplorerNode,
    readonly id: string,
    title: string,
    collapsible: vscode.TreeItemCollapsibleState
  ) {
    this.item = new vscode.TreeItem(title, collapsible);
  }

  async getChildren(): Promise<ExplorerNode[]> {
    return [];
  }
}
