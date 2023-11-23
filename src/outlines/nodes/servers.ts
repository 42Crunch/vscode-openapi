import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";

export class ServersNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, node: any) {
    super(
      parent,
      "/servers",
      "Servers",
      vscode.TreeItemCollapsibleState.Collapsed,
      node,
      parent.context
    );
    this.icon = "server.svg";
    this.contextValue = "servers";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenById(
      (_id, pointer, node) => new SimpleNode(this, pointer, this.getServerLabel(node), node, 0)
    );
  }

  getServerLabel(value: any): string {
    return value && value["url"] ? value["url"] : "<unknown>";
  }
}
