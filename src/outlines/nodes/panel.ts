import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";

export const panelsVer2 = ["responses", "parameters", "definitions", "securityDefinitions"];

const icons: any = {
  responses: "arrow-right-from-bracket.svg",
  parameters: "sliders.svg",
  securityDefinitions: "shield-halved.svg",
};

export class PanelNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, key: string, node: any) {
    super(
      parent,
      "/" + key,
      key === "securityDefinitions" ? "security definitions" : key,
      vscode.TreeItemCollapsibleState.Expanded,
      node,
      parent.context
    );
    this.icon = icons[key];
    this.contextValue = key;
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey(
      (key, pointer, node) => new SimpleNode(this, pointer, key, node, 0)
    );
  }
}
