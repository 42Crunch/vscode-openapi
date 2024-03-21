import * as vscode from "vscode";

import { HttpMethod } from "@xliic/openapi";
import { Container, getLocation } from "@xliic/preserving-json-yaml-parser";

import { encodeJsonPointerSegment } from "../../pointer";
import { AbstractOutlineNode, HTTP_METHODS, OutlineNode } from "./base";
import { SimpleNode, getParameterLabel } from "./simple";

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
            const opNode = new OperationIdNode(
              this,
              id,
              operationId,
              operation,
              pathName,
              opName as HttpMethod
            );
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

export class OperationIdNode extends AbstractOutlineNode {
  readonly path: string;
  readonly method: HttpMethod;

  constructor(
    parent: OutlineNode,
    pointer: string,
    key: string,
    node: any,
    path: string,
    method: HttpMethod
  ) {
    super(parent, pointer, key, vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
    this.path = path;
    this.method = method;
    this.contextValue = "operation-id";
  }

  getChildren(): OutlineNode[] {
    return this.getChildrenByKey((key, pointer, node) => {
      if (["responses", "parameters", "requestBody", "security"].includes(key)) {
        if (key == "parameters") {
          return new SimpleNode(this, pointer, key, node, 1, getParameterLabel);
        } else if (key === "security") {
          return new SimpleNode(this, pointer, key, node, 0);
        } else {
          return new SimpleNode(this, pointer, key, node, 1);
        }
      }
    });
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
