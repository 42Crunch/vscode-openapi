import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";

const subComponents = new Set([
  "schemas",
  "responses",
  "parameters",
  "examples",
  "requestBodies",
  "headers",
  "securitySchemes",
  "links",
  "callbacks",
]);

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
    this.icon = "box.svg";
    this.contextValue = "components";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey((key, pointer, node) => {
      if (subComponents.has(key)) {
        return new SimpleNode(this, pointer, key, node, 1);
      }
    });
  }
}
