import * as vscode from "vscode";

import { getLocation } from "@xliic/preserving-json-yaml-parser";
import { AbstractOutlineNode, OutlineNode } from "./base";
import { SimpleNode } from "./simple";
import { OpenApiVersion } from "../../types";

export const targetsVer2 = [
  "openapi",
  "swagger",
  "host",
  "basePath",
  "info",
  "schemes",
  "consumes",
  "produces",
  "externalDocs",
];

const targetsVer3 = ["openapi", "info", "externalDocs", "jsonSchemaDialect"];

const targetsByVersion: Record<OpenApiVersion, string[]> = {
  [OpenApiVersion.V2]: targetsVer2,
  [OpenApiVersion.V3]: targetsVer3,
  [OpenApiVersion.V3_1]: targetsVer3,
  [OpenApiVersion.Unknown]: [],
};

export class GeneralNode extends AbstractOutlineNode {
  constructor(parent: OutlineNode, node: any) {
    super(parent, "", "General", vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
    this.icon = "file-lines.svg";
    this.contextValue = "top-general";
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    const res = [];
    if (this.node) {
      const targets = targetsByVersion[this.context.version];
      for (const key of Object.keys(this.node)) {
        if (targets.includes(key)) {
          const childNode = new SimpleNode(this, this.nextPointer(key), key, this.node[key], 0);
          res.push(childNode);
          const location = getLocation(this.node, key);
          if (location) {
            childNode.updateLocation(location);
          }
        }
      }
    }
    return res;
  }
}
