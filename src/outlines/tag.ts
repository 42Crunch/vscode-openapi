/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { find, getLocation, Location } from "@xliic/preserving-json-yaml-parser";
import { Container } from "@xliic/preserving-json-yaml-parser/lib/types";
import * as vscode from "vscode";
import { Cache } from "../cache";
import { OpenApiVersion } from "../types";

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

type UniqueOperationName = OperationId | PathMethodId;

interface TagName {
  type: "tag";
  name: string;
  operations: TagOperation[];
}

interface TagOperation {
  type: "operation";
  name: UniqueOperationName;
  operation: any;
  location: Location;
}

type TagNode = TagName | TagOperation;

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

export class TagOutlineProvider implements vscode.TreeDataProvider<TagNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;
  tags: { [tag: string]: TagName } = {};

  constructor(private context: vscode.ExtensionContext, private cache: Cache) {
    cache.onDidActiveDocumentChange(async (document) => {
      if (document) {
        this.tags = {};
        const version = this.cache.getDocumentVersion(document);
        if (version !== OpenApiVersion.Unknown) {
          const root = cache.getLastGoodParsedDocument(document);
          if (root) {
            const paths = find(root, "/paths");
            if (paths && typeof paths === "object") {
              for (const [path, pathitem] of Object.entries(paths)) {
                for (const [method, operation] of Object.entries(<object>pathitem)) {
                  if (!HTTP_METHODS.includes(method)) {
                    break;
                  }
                  const tags = operation["tags"];
                  const name = getUniqueName(path, method, operation);
                  const location = getLocation(<Container>pathitem, method)!;
                  const tagOperation: TagOperation = {
                    type: "operation",
                    name,
                    operation,
                    location,
                  };
                  if (Array.isArray(tags)) {
                    for (const tag of tags) {
                      if (tag in this.tags) {
                        this.tags[tag].operations.push(tagOperation);
                      } else {
                        this.tags[tag] = {
                          type: "tag",
                          name: tag,
                          operations: [tagOperation],
                        };
                      }
                    }
                  }
                }
              }
            }
          }
        }
        this._onDidChangeTreeData.fire();
      }
    });
  }

  getTreeItem(node: TagNode): vscode.TreeItem {
    if (node.type === "tag") {
      return new vscode.TreeItem(
        node.name,
        node.operations.length > 0
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None
      );
    }

    const item = new vscode.TreeItem(
      uniqueNameToString(node.name),
      vscode.TreeItemCollapsibleState.None
    );

    item.tooltip = `${node.name.method.toUpperCase()} ${node.name.path}`;

    if (vscode.window?.activeTextEditor) {
      item.command = getCommand(vscode.window.activeTextEditor, node);
    }

    return item;
  }

  getChildren(node?: TagNode): TagNode[] {
    if (!node) {
      const tags = Object.keys(this.tags);
      tags.sort((a, b) => {
        return a.localeCompare(b);
      });
      return tags.map((tag) => this.tags[tag]);
    }
    if (node.type === "tag") {
      node.operations.sort(sortUniqueNames);
      return node.operations;
    }
    return [];
  }
}

function sortUniqueNames(a: TagOperation, b: TagOperation) {
  // in case if operationId is used just do string compare
  if (a.name.type === "operationId" && b.name.type == "operationId") {
    const aName = uniqueNameToString(a.name);
    const bName = uniqueNameToString(b.name);
    return aName.localeCompare(bName);
  }

  // in case of pathMethod compare using path and then method
  // to group by PATH
  if (a.name.type === "pathMethod" && b.name.type == "pathMethod") {
    const pathCompare = a.name.path.localeCompare(b.name.path);
    const methodCompare = a.name.method.localeCompare(b.name.method);
    if (pathCompare === 0 && methodCompare === 0) {
      return 0;
    }
    if (pathCompare === 0) {
      return methodCompare;
    }
    return pathCompare;
  }

  // operationId names should always come up first
  if (a.name.type === "operationId" && b.name.type == "pathMethod") {
    return -1;
  } else {
    return 1;
  }
}

function uniqueNameToString(name: UniqueOperationName) {
  const uniqueName =
    name.type === "operationId" ? name.operationId : `${name.method.toUpperCase()} ${name.path}`;
  return uniqueName;
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

function getCommand(editor: vscode.TextEditor, operation: TagOperation): vscode.Command {
  const { start, end } = operation.location.key!;
  return {
    command: "openapi.goToLine",
    title: "",
    arguments: [
      new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end)),
    ],
  };
}
