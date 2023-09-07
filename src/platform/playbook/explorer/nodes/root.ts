import * as vscode from "vscode";

import { AbstractOutlineNode, OutlineContext, OutlineNode } from "./base";
import { SimpleNode } from "./simple";
// import { GeneralNode } from "./general";
// import { OpenApiVersion } from "../../types";
// import { PathsNode } from "./paths";
// import { OperationIdsNode } from "./operation-ids";
// import { ServersNode } from "./servers";
// import { ComponentsNode } from "./components";
// import { SecurityNode } from "./security";
// import { PanelNode, panelsVer2 } from "./panel";
// import { TagsNode } from "./tags";

const numOfChildren: any = {
  runtimeConfiguration: 0,
  customizations: 1,
  authorizationTests: 1,
  authenticationDetails: 1,
  apiVersion: 1,
  before: 1,
  after: 1,
  hooks: 1,
  operations: 2,
  requests: 2,
  environments: 1,
};

const lablers: any = {
  before: function (id: string, value: any): string {
    return "beforeItem[" + id + "]";
  },
  authenticationDetails: function (id: string, value: any): string {
    return "authDetailsItem[" + id + "]";
  },
};

export class RootNode extends AbstractOutlineNode {
  constructor(root: any, context: OutlineContext) {
    super(undefined, "/", "", vscode.TreeItemCollapsibleState.Expanded, root, context);
    //this.searchable = false;
  }

  getChildren(): OutlineNode[] {
    const res: OutlineNode[] = [];
    if (this.node) {
      // if (this.context.search) {
      //   res.push(new SearchNode(this, this.context));
      // }
      // res.push(new GeneralNode(this, this.node));
      // res.push(new TagsNode(this, this.node["tags"], this.node["paths"]));
      // res.push(new OperationIdsNode(this, this.node["paths"]));
      for (const key of Object.keys(this.node)) {
        if (key in numOfChildren) {
          const num = numOfChildren[key];
          const node = new SimpleNode(this, "/" + key, key, this.node[key], num, lablers[key]);
          node.icon = "book.svg";
          res.push(node);
        }

        // if (key === "paths") {
        //   res.push(new PathsNode(this, this.node[key]));
        // } else if (key === "security") {
        //   res.push(new SecurityNode(this, this.node[key]));
        // } else {
        //   if (this.context.version == OpenApiVersion.V3) {
        //     if (key === "servers") {
        //       res.push(new ServersNode(this, this.node[key]));
        //     } else if (key === "components") {
        //       res.push(new ComponentsNode(this, this.node[key]));
        //     }
        //   } else {
        //     if (panelsVer2.includes(key)) {
        //       res.push(new PanelNode(this, key, this.node[key]));
        //     }
        //   }
        // }
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
