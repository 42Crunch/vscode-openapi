import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";

export class ComponentsNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, node: any) {
    super(
      parent,
      "/components",
      "Components",
      vscode.TreeItemCollapsibleState.Expanded,
      node,
      parent.context
    );
    this.icon = "gear.svg";
    this.contextValue = "components";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey(
      (key, pointer, node) => new SimpleNode(this, pointer, key, node, 1)
    );
  }
}
