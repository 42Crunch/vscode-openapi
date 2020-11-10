/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as json from 'jsonc-parser';
import { Node } from './types';
import { parseJsonPointer, joinJsonPointer } from '../pointer';

export function parseJson(text: string): [JsonNode, { message: string; offset: number }[]] {
  const parseErrors: json.ParseError[] = [];
  const node = new JsonNode(json.parseTree(text, parseErrors, { allowTrailingComma: true, allowEmptyContent: true }));
  const normalizedErrors = parseErrors.map((error) => ({
    message: json.printParseErrorCode(error.error),
    offset: error.offset,
  }));

  return [node, normalizedErrors];
}

export class JsonNode implements Node {
  node: json.Node;

  constructor(node: json.Node) {
    this.node = node;
  }

  find(rawpointer: string) {
    const pointer = parseJsonPointer(rawpointer);

    let node = this.node;

    if (!node) {
      return null;
    }

    for (let segment of pointer) {
      // each object we traverse must be either object or array
      if (node.type === 'object' && Array.isArray(node.children)) {
        let found = false;
        for (let propertyNode of node.children) {
          if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment) {
            node = propertyNode.children[1];
            found = true;
            break;
          }
        }
        if (!found) {
          return null;
        }
      } else {
        const index = parseInt(segment, 10);
        if (node.type === 'array' && index >= 0 && Array.isArray(node.children) && index < node.children.length) {
          node = node.children[index];
        } else {
          return null;
        }
      }
    }

    return new JsonNode(node);
  }

  getParent(): JsonNode {
    // each value node must have either property or array as it's parent
    // but check for type=object parent just in case
    const parent = this.node.parent;
    if (parent) {
      if (parent.type === 'property') {
        return new JsonNode(parent.parent);
      } else if (parent.type === 'array' || parent.type === 'object') {
        return new JsonNode(parent);
      }
    }
  }

  getKey(): string {
    const parent = this.node.parent;
    if (parent) {
      if (parent.type === 'property') {
        return parent.children[0].value;
      } else if (parent.type === 'array') {
        return String(parent.children.indexOf(this.node));
      }
    }
    return null;
  }

  getValue(): string {
    return this.node.value;
  }

  getRange(): [number, number] {
    return [this.node.offset, this.node.offset + this.node.length];
  }

  getChildren(): JsonNode[] {
    if (this.node.type === 'object') {
      return this.node.children.map((child) => new JsonNode(child.children[1]));
    } else if (this.node.type === 'array') {
      return this.node.children.map((child) => new JsonNode(child));
    }
  }

  getDepth(): number {
    let depth = 0;
    let parent = this.node.parent;
    while (parent) {
      if (parent.type === 'object' || parent.type === 'array') {
        depth++;
      }
      parent = parent.parent;
    }
    return depth;
  }

  findNodeAtOffset(offset: number) {
    const node = json.findNodeAtOffset(this.node, offset);
    if (node) {
      return new JsonNode(node);
    }
    return null;
  }

  getJsonPonter(): string {
    return joinJsonPointer(json.getNodePath(this.node));
  }
}
