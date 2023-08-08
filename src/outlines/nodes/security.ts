import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";
import { encodeJsonPointerSegment } from "../../pointer";

export class SecurityNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, node: any) {
    super(
      parent,
      "/security",
      "security",
      vscode.TreeItemCollapsibleState.Expanded,
      node,
      parent.context
    );
    this.icon = "shield-check.svg";
    this.contextValue = "security";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenById(
      (_id, pointer, node) => new SimpleNode(this, pointer, this.getSecurityLabel(node), node, 0)
    );
  }

  getSecurityLabel(value: any): string {
    const keys = Object.keys(value);
    if (keys[0]) {
      return keys[0];
    }
    return "<unknown>";
  }
}
