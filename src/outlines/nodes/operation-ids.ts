import * as vscode from "vscode";

import { AbstractOutlineNode, HTTP_METHODS, OutlineNode } from "./base";
import { SimpleNode } from "./simple";
import { encodeJsonPointerSegment } from "../../pointer";
import { Container, Location, getLocation } from "@xliic/preserving-json-yaml-parser";

export class OperationIdsNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, node: any) {
    super(
      parent,
      "",
      "Operation ID",
      hasOperationIds(node)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      node,
      parent.context
    );
    this.icon = "id-card.svg";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    const operations = [];
    if (this.node) {
      for (const pathName of Object.keys(this.node)) {
        let id = "/paths/" + encodeJsonPointerSegment(pathName);
        const path = this.node[pathName];
        for (const opName of Object.keys(path)) {
          if (!HTTP_METHODS.includes(opName)) {
            continue;
          }
          const operation = path[opName];
          const operationId = operation["operationId"];
          if (operationId) {
            id += "/" + encodeJsonPointerSegment(opName) + "/operationId";
            const opNode = new SimpleNode(this, id, operationId, operation, 0);
            const location = getLocation(path as Container, opName);
            if (location) {
              opNode.updateLocation(location);
            }
            operations.push(opNode);
          }
        }
      }
    }
    return operations;
  }
}

function hasOperationIds(node: any): boolean {
  if (node) {
    for (const pathName of Object.keys(node)) {
      const path = node[pathName];
      for (const opName of Object.keys(path)) {
        if (HTTP_METHODS.includes(opName) && path[opName]["operationId"]) {
          return true;
        }
      }
    }
  }
  return false;
}
