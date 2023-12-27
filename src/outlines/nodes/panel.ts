import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";

export const panelsVer2 = ["responses", "parameters", "definitions", "securityDefinitions"];

const icons: any = {
  responses: "response.svg",
  parameters: "sliders.svg",
  definitions: "sitemap.svg",
  securityDefinitions: "shield-halved.svg",
};

const titles: any = {
  parameters: "Parameters",
  responses: "Responses",
  definitions: "Definitions",
  securityDefinitions: "Security Definitions",
};

export class PanelNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, key: string, node: any) {
    super(
      parent,
      "/" + key,
      capitalize(key),
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

function capitalize(title: string): string {
  return title in titles ? titles[title] : title;
}
