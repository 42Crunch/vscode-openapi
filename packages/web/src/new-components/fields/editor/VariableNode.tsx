/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Spread } from "lexical";

import {
  TextNode,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
} from "lexical";

export type SerializedVariableNode = Spread<
  {
    exists: boolean;
    name: string;
  },
  SerializedTextNode
>;

const variableStyleExist = "background: rgba(24, 119, 232, 0.2); border-radius: 4px;";
const variableStyleDoesNotExist = "background: rgba(124, 119, 232, 0.2); border-radius: 4px;";

export class VariableNode extends TextNode {
  __exists: boolean;

  static getType(): string {
    return "variable";
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__text, node.__name, node.__exists, node.__key);
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const node = $createVariableNode(
      serializedNode.text,
      serializedNode.name,
      serializedNode.exists
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(text: string, name: string, exists: boolean, key?: NodeKey) {
    super(text, key);
    this.__name == name;
    this.__exists = exists;
  }

  exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      name: this.__name,
      exists: this.__exists,
      type: "variable",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    if (this.__exists) {
      dom.style.cssText = variableStyleExist;
    } else {
      dom.style.cssText = variableStyleDoesNotExist;
    }
    dom.className = "variable";
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-variable", "true");
    element.textContent = this.__text;
    return { element };
  }

  updateDOM(prevNode: VariableNode, dom: HTMLElement, config: EditorConfig): boolean {
    // if (prevNode.__exists !== this.__exists) {
    //   if (this.__exists) {
    //     dom.style.cssText = variableStyleExist;
    //   } else {
    //     dom.style.cssText = variableStyleDoesNotExist;
    //   }
    // }
    // return false;
    return true;
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return true;
  }

  canInsertTextAfter(): boolean {
    return true;
  }

  setExists(exists: boolean) {
    const self = this.getWritable();
    self.__exists = exists;
  }

  getExists(): boolean {
    const self = this.getLatest();
    return self.__exists;
  }
}

export function $createVariableNode(text: string, name: string, exists: boolean): VariableNode {
  return new VariableNode(text, name, exists);
}

export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}
