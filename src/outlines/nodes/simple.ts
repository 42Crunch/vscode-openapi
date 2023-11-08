import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";
import { OpenApiVersion } from "../../types";

const icons: any = {
  schemas: "sitemap.svg",
  headers: "line-columns.svg",
  securitySchemes: "shield-halved.svg",
  links: "link-simple.svg",
  callbacks: "phone-arrow-up-right.svg",
  examples: "message-code.svg",
  responses: "arrow-left-from-bracket.svg",
  parameters: "sliders.svg",
  requestBodies: "arrow-right-to-bracket.svg",
};

const contextValues: any = {
  parameters: "parameter",
  responses: "response",
  definitions: "definition",
  security: "securityItem",
  securityDefinitions: "securityDefinition",
  servers: "server",
};

const titles: any = {
  parameters: "Parameters",
  responses: "Responses",
  securitySchemes: "Security Schemes",
  schemas: "Schemas",
  requestBodies: "Request Bodies",
  headers: "Headers",
  links: "Links",
  callbacks: "Callbacks",
  examples: "Examples",
};

export class SimpleNode extends AbstractOutlineNode {
  readonly depth: number;
  readonly getTitle?: Function;

  constructor(
    parent: OutlineNode,
    pointer: string,
    key: string,
    node: any,
    depth: number,
    getTitle?: Function
  ) {
    super(
      parent,
      pointer,
      capitalize(key, pointer),
      depth == 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
      node,
      parent.context
    );
    this.icon = icons[key];
    this.depth = depth;
    this.getTitle = getTitle;
    const parentContextValue = parent.contextValue;
    if (parentContextValue && contextValues[parentContextValue]) {
      this.contextValue = contextValues[parentContextValue];
    } else if (this.context.version === OpenApiVersion.V3) {
      const grandParent = parent.parent;
      if (grandParent && grandParent.contextValue === "components") {
        this.contextValue = "component";
      }
    }
    this.searchable = !(parent.id === "/components" || parent.contextValue === "general");
  }

  getChildren(): OutlineNode[] {
    const res = [];
    if (this.node && this.depth > 0) {
      if (typeof this.node === "object") {
        if (this.node instanceof Array) {
          let id = 0;
          for (const item of this.node) {
            const pointer = this.nextPointer(id);
            const title = this.getTitle ? this.getTitle(String(id), item) : "<unknown(" + id + ")>";
            res.push(new SimpleNode(this, pointer, title, item, this.depth - 1));
            id += 1;
          }
        } else {
          for (const key of Object.keys(this.node)) {
            const pointer = this.nextPointer(key);
            const title = this.getTitle ? this.getTitle(key, this.node[key]) : key;
            res.push(new SimpleNode(this, pointer, title, this.node[key], this.depth - 1));
          }
        }
      }
    }
    return res;
  }
}

function capitalize(title: string, pointer: string): string {
  if (pointer.startsWith("/paths")) {
    return title;
  }
  return title in titles ? titles[title] : title;
}
