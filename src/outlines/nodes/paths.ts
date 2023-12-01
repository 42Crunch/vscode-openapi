import * as vscode from "vscode";

import { HttpMethod } from "@xliic/common/http";

import { AbstractOutlineNode, HTTP_METHODS, OutlineNode } from "./base";
import { SimpleNode } from "./simple";

export class PathsNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, node: any) {
    super(
      parent,
      "/paths",
      "Paths",
      vscode.TreeItemCollapsibleState.Expanded,
      node,
      parent.context
    );
    this.icon = "swap-arrows.svg";
    this.contextValue = "paths";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey((key, pointer, node) => new PathNode(this, pointer, key, node));
  }
}

export class PathNode extends AbstractOutlineNode {
  path: string;
  constructor(parent: OutlineNode, pointer: string, key: string, node: any) {
    super(parent, pointer, key, vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
    this.contextValue = "path";
    this.path = key;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey((key, pointer, node) => {
      if (HTTP_METHODS.includes(key)) {
        return new OperationNode(this, pointer, key, node);
      }
    });
  }
}

export class OperationNode extends AbstractOutlineNode {
  method: HttpMethod;
  constructor(parent: OutlineNode, pointer: string, key: string, node: any) {
    super(parent, pointer, key, vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
    this.contextValue = "operation";
    this.method = key as HttpMethod;
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey((key, pointer, node) => {
      if (["responses", "parameters"].includes(key)) {
        if (key == "parameters") {
          return new SimpleNode(this, pointer, key, node, 1, this.getParameterLabel);
        } else {
          return new SimpleNode(this, pointer, key, node, 1);
        }
      }
    });
  }

  getParameterLabel(_key: string, value: any): string {
    // return label for a parameter
    const label = value["$ref"] || value["name"];
    if (!label) {
      return "<unknown>";
    }
    return label;
  }
}
