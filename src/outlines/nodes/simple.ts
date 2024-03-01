import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineNode } from "./base";

const icons: any = {
  schemas: "sitemap.svg",
  headers: "line-columns.svg",
  securitySchemes: "shield-keyhole.svg",
  links: "link-simple.svg",
  callbacks: "phone-arrow-up-right.svg",
  examples: "message-code.svg",
  responses: "response.svg",
  parameters: "sliders.svg",
  requestBodies: "request.svg",
  requestBody: "request.svg",
  security: "key.svg",
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
    this.contextValue = getContextValue(key, parent);
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
  if (pointer.startsWith("/paths") || pointer.startsWith("/tags")) {
    return title;
  }
  return title in titles ? titles[title] : title;
}

function getContextValue(key: string, parent: OutlineNode): string | undefined {
  const parentCv = parent.contextValue;
  if (parentCv && contextValues[parentCv]) {
    return contextValues[parentCv];
  }
  if (parentCv === "components") {
    return key;
  }
  if (parent?.parent?.contextValue === "components") {
    return "component";
  }
  return "simple-child";
}

export function getParameterLabel(_key: string, value: any): string {
  // return label for a parameter
  const label = value["$ref"] || value["name"];
  if (!label) {
    return "<unknown>";
  }
  return label;
}
