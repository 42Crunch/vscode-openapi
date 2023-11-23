import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineContext, OutlineNode } from "./base";
import { GeneralNode } from "./general";
import { OpenApiVersion } from "../../types";
import { PathsNode } from "./paths";
import { OperationIdsNode } from "./operation-ids";
import { ServersNode } from "./servers";
import { ComponentsNode } from "./components";
import { SecurityNode } from "./security";
import { PanelNode, panelsVer2 } from "./panel";
import { TagsNode } from "./tags";

export class RootNode extends AbstractOutlineNode {
  constructor(root: any, context: OutlineContext) {
    super(undefined, "/", "", vscode.TreeItemCollapsibleState.Expanded, root, context);
    this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    const res = [];
    if (this.node) {
      if (this.context.search) {
        res.push(new SearchNode(this, this.context));
      }
      res.push(new GeneralNode(this, this.node));
      if (this.context.version == OpenApiVersion.V3) {
        res.push(new ServersNode(this, this.node["servers"]));
      }
      res.push(new SecurityNode(this, this.node["security"]));
      res.push(new TagsNode(this, this.node["tags"], this.node["paths"]));
      res.push(new OperationIdsNode(this, this.node["paths"]));
      res.push(new PathsNode(this, this.node["paths"]));
      if (this.context.version == OpenApiVersion.V3) {
        res.push(new ComponentsNode(this, this.node["components"]));
      } else {
        for (const key of panelsVer2) {
          res.push(new PanelNode(this, key, this.node[key]));
        }
      }
    }
    return res;
  }
}

export class SearchNode extends AbstractOutlineNode {
  constructor(readonly parent: OutlineNode, readonly context: OutlineContext) {
    super(
      parent,
      `oultine-search`,
      `Search: ${context.search}`,
      vscode.TreeItemCollapsibleState.None,
      undefined,
      context
    );
    this.icon = "search.svg";
    this.contextValue = "outlineSearch";
    this.searchable = false;
  }
}
