import * as vscode from "vscode";

import { AbstractOutlineNode, HTTP_METHODS, OutlineNode } from "./base";
import { Container, Location, getLocation } from "@xliic/preserving-json-yaml-parser";

type OperationId = {
  type: "operationId";
  operationId: string;
  path: string;
  method: string;
};

type PathMethodId = {
  type: "pathMethod";
  path: string;
  method: string;
};

export type UniqueOperationName = OperationId | PathMethodId;

export interface TagOperation {
  type: "operation";
  name: UniqueOperationName;
  operation: any;
  location: Location;
}

export class TagsNode extends AbstractOutlineNode {
  readonly paths: any[];

  constructor(parent: OutlineNode, tags: any, paths: any) {
    super(parent, "/tags", "Tags", vscode.TreeItemCollapsibleState.Collapsed, tags, parent.context);
    this.paths = paths;
    this.icon = "tag.svg";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    const tagNodes = [];
    const tagsOpsMap = new Map<string, TagOperation[]>();
    const tagsPointersMap = new Map<string, string>();
    const tagsNodesMap = new Map<string, any>();
    // Collect all tags from all operations
    if (this.paths) {
      for (const [pathName, path] of Object.entries(this.paths)) {
        for (const [opName, operation] of Object.entries(path as any)) {
          if (!HTTP_METHODS.includes(opName)) {
            continue;
          }
          const tags = (operation as any)["tags"];
          if (Array.isArray(tags)) {
            for (const tag of tags) {
              if (!tagsOpsMap.has(tag)) {
                tagsOpsMap.set(tag, []);
              }
              const opId = operation as any["operationId"];
              if (opId) {
                const name = getUniqueName(pathName, opName, operation);
                const location = getLocation(<Container>path, opName)!;
                const tagOperation: TagOperation = {
                  type: "operation",
                  name,
                  operation,
                  location,
                };
                tagsOpsMap.get(tag)?.push(tagOperation);
              }
            }
          }
        }
      }
    }
    // Collect all tags from tags object
    if (this.node) {
      const tags = this.node;
      let ix = 0;
      for (const tag of tags) {
        const tagName = tag["name"];
        if (tagName) {
          if (!tagsOpsMap.has(tagName)) {
            tagsOpsMap.set(tagName, []);
          }
          tagsPointersMap.set(tagName, this.nextPointer(ix));
          tagsNodesMap.set(tagName, tag);
          ix += 1;
        }
      }
    }
    for (const [tagName, operations] of tagsOpsMap) {
      const pointer = tagsPointersMap.get(tagName) || this.nextPointer(tagName);
      const node = tagsNodesMap.get(tagName);
      tagNodes.push(new TagNode(this, pointer, tagName, node, operations));
    }
    return tagNodes;
  }
}

export class TagNode extends AbstractOutlineNode {
  readonly tagOps: TagOperation[];

  constructor(
    parent: OutlineNode,
    pointer: string,
    key: string,
    node: any,
    operations: TagOperation[]
  ) {
    super(
      parent,
      pointer,
      key,
      operations.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed,
      node,
      parent.context
    );
    this.tagOps = operations;
    this.contextValue = "tag";
  }

  getChildren(): OutlineNode[] {
    const res = [];
    if (this.tagOps) {
      let ix = 0;
      for (const tagOp of this.tagOps) {
        res.push(new TagChildNode(this, this.nextPointer(ix), tagOp));
        ix += 1;
      }
    }
    return res;
  }
}

export class TagChildNode extends AbstractOutlineNode {
  public readonly tagOp: TagOperation;

  constructor(parent: OutlineNode, id: string, tagOp: TagOperation) {
    super(
      parent,
      id,
      uniqueNameToString(tagOp.name),
      vscode.TreeItemCollapsibleState.None,
      tagOp.operation,
      parent.context
    );
    this.tagOp = tagOp;
    this.updateLocation(tagOp.location);
    if (tagOp.name.type === "operationId") {
      this.item.tooltip = getTooltip(tagOp.name);
    }
  }
}

function getTooltip(name: UniqueOperationName) {
  return `${name.method.toUpperCase()} ${name.path}`;
}

function uniqueNameToString(name: UniqueOperationName) {
  return name.type === "operationId" ? name.operationId : getTooltip(name);
}

function getUniqueName(path: string, method: string, operation: any): UniqueOperationName {
  const operationId = operation["operationId"];
  if (operationId && operationId !== "") {
    return { type: "operationId", operationId, path, method };
  }
  return {
    type: "pathMethod",
    method,
    path,
  };
}
