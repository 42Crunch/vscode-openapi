/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as yaml from 'yaml-ast-parser';
import { Kind, Node } from './types';
import { parseJsonPointer } from './pointer';

export function findNodeAtLocation(root: yaml.YAMLNode, path: string[]): yaml.YAMLNode {
  if (path.length === 0) {
    return root;
  }

  if (root && root.kind === yaml.Kind.MAP) {
    const head = path[0];
    const tree = <yaml.YamlMap>root;
    for (const mapping of tree.mappings) {
      if (mapping.key && mapping.key.kind === yaml.Kind.SCALAR && mapping.key.value === head) {
        if (path.length === 1) {
          // this is the last entry in path, return found node
          return mapping;
        } else {
          return findNodeAtLocation(mapping.value, path.slice(1));
        }
      }
    }
  } else if (root && root.kind === yaml.Kind.SEQ) {
    const tree = <yaml.YAMLSequence>root;
    const index = parseInt(path[0] as string, 10);
    const mapping = tree.items[index];
    if (path.length === 1) {
      // this is the last entry in path, return found node
      return mapping;
    } else {
      return findNodeAtLocation(mapping, path.slice(1));
    }
  }
  return null;
}

export class YamlNode implements Node {
  node: yaml.YAMLNode;

  constructor(node: yaml.YAMLNode) {
    this.node = node;
  }

  getKind() {
    return Kind.Yaml;
  }

  find(rawpointer: string) {
    const pointer = parseJsonPointer(rawpointer);
    const result = findNodeAtLocation(this.node, pointer);
    if (result) {
      return new YamlNode(result);
    }
    return null;
  }

  getParent(): YamlNode {
    return new YamlNode(this.node.parent.parent);
  }

  getKey() {
    if (this.node.kind === yaml.Kind.MAPPING) {
      const mapping = <yaml.YAMLMapping>this.node;
      return mapping.key.value;
    } else if (this.node.parent && this.node.parent.kind === yaml.Kind.SEQ) {
      const seq = <yaml.YAMLSequence>this.node.parent;
      return String(seq.items.indexOf(this.node));
    }
  }

  getValue() {
    if (this.node.kind === yaml.Kind.MAPPING) {
      const mapping = <yaml.YAMLMapping>this.node;
      if (mapping && mapping.value && mapping.value.value) {
        return mapping.value.value;
      }
    } else if (this.node.kind === yaml.Kind.SCALAR) {
      return (<yaml.YAMLScalar>this.node).value;
    }
  }

  getRange(): [number, number] {
    return [this.node.startPosition, this.node.endPosition];
  }

  getChildren(): YamlNode[] {
    const result = [];
    if (this.node.kind === yaml.Kind.MAPPING) {
      const value = this.node.value;
      if (value && value.kind === yaml.Kind.MAP) {
        for (const mapping of value.mappings) {
          if (mapping) {
            result.push(new YamlNode(mapping));
          }
        }
      } else if (value && value.kind === yaml.Kind.SEQ) {
        for (const item of value.items) {
          if (item) {
            result.push(new YamlNode(item));
          }
        }
      }
    } else if (this.node.kind === yaml.Kind.MAP) {
      for (const mapping of this.node.mappings) {
        result.push(new YamlNode(mapping));
      }
    }
    return result;
  }

  getDepth(): number {
    let depth = 0;
    let parent = this.node.parent;
    while (parent) {
      if (parent.kind === yaml.Kind.MAP || parent.kind === yaml.Kind.SEQ) {
        depth++;
      }
      parent = parent.parent;
    }
    return depth;
  }

  findNodeAtOffset(offset: number): YamlNode {
    if (offset >= this.node.startPosition && offset < this.node.endPosition) {
      for (const child of this.getChildren()) {
        const node = child.findNodeAtOffset(offset);
        if (node) {
          return node;
        }
      }
      return this;
    }
    return null;
  }
}
