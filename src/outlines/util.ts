/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { HttpMethod } from "@xliic/openapi";

import { OperationIdNode } from "./nodes/operation-ids";
import { OperationNode, PathNode } from "./nodes/paths";
import { TagChildNode } from "./nodes/tags";

export function getPathAndMethod(node: OperationNode | TagChildNode | OperationIdNode): {
  path: string;
  method: HttpMethod;
} {
  if (node.contextValue === "operation") {
    const operation = node as OperationNode;
    return {
      path: (operation.parent as PathNode).path,
      method: operation.method,
    };
  } else if (node.contextValue == "tag-child") {
    const tagChild = node as TagChildNode;
    return {
      path: tagChild.tagOp.name.path,
      method: tagChild.tagOp.name.method,
    };
  } else if (node.contextValue == "operation-id") {
    const operationId = node as OperationIdNode;
    return {
      path: operationId.path,
      method: operationId.method,
    };
  }

  throw new Error(`Unable to get path and method from the node: ${node.contextValue}`);
}
