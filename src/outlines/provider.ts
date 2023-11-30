import * as vscode from "vscode";
import * as path from "path";

import { RootNode } from "./nodes/root";
import { Cache } from "../cache";
import { OpenApiVersion } from "../types";
import { configuration } from "../configuration";
import { OutlineContext, OutlineNode } from "./nodes/base";

const panelsListVer3 = [
  "general",
  "tags",
  "paths",
  "operation id",
  "servers",
  "components",
  "security",
];

const panelsListVer2 = [
  "general",
  "tags",
  "paths",
  "operation id",
  "parameters",
  "responses",
  "definitions",
  "security",
  "security definitions",
];

export class OutlineProvider implements vscode.TreeDataProvider<OutlineNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  private rootNode?: RootNode;
  private documentUri?: string;
  private sort: boolean;
  private search: { [uri: string]: string | undefined };

  constructor(private context: vscode.ExtensionContext, private cache: Cache) {
    this.search = {};
    cache.onDidActiveDocumentChange(async (document) => {
      if (document) {
        const version = this.cache.getDocumentVersion(document);
        if (version !== OpenApiVersion.Unknown) {
          this.documentUri = document.uri.toString();
          const root = cache.getLastGoodParsedDocument(document);
          if (!(this.documentUri in this.search)) {
            this.search[this.documentUri] = undefined;
          }
          const context = {
            version,
            documentUri: this.documentUri,
            search: this.search[this.documentUri],
          };
          this.rootNode = new RootNode(root, context);
        }
        this.refresh();
      }
    });

    vscode.workspace.onDidCloseTextDocument((document) => {
      if (this.documentUri === document.uri.toString()) {
        this.rootNode = undefined;
        this.documentUri = undefined;
        this.search = {};
        vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
        vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
      }
    });

    this.sort = configuration.get<boolean>("sortOutlines");
    configuration.onDidChange(this.onConfigurationChanged, this);
  }

  onConfigurationChanged(e: vscode.ConfigurationChangeEvent) {
    if (configuration.changed(e, "sortOutlines")) {
      this.sort = configuration.get<boolean>("sortOutlines");
      this.refresh();
    }
  }

  runSearch(name?: string) {
    if (this.rootNode && this.documentUri) {
      this.search[this.documentUri] = name;
      this.rootNode.context.search = name;
    }
  }

  getParent?(element: OutlineNode): vscode.ProviderResult<OutlineNode> {
    return element?.parent;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(node: OutlineNode): vscode.TreeItem | Promise<vscode.TreeItem> {
    const item = node.item;
    if (item) {
      item.id = node.id;
      item.contextValue = node.contextValue;
      if (node.icon) {
        item.iconPath = this.getIcon(node.icon);
      }
    }
    return item;
  }

  getIcon(icon: string | { dark: string; light: string }) {
    if (typeof icon === "string") {
      return {
        light: this.context.asAbsolutePath(path.join("resources", "light", icon as string)),
        dark: this.context.asAbsolutePath(path.join("resources", "dark", icon as string)),
      };
    }
  }

  getChildren(node?: OutlineNode): OutlineNode[] {
    if (node) {
      const children = node.getAndFilterChildren();
      if (children.length > 2) {
        return this.sortChildren(children);
      }
      return children;
    }
    if (this.rootNode) {
      return this.sortRootChildren(this.rootNode.getChildren());
    }
    return [];
  }

  sortChildren(children: OutlineNode[]) {
    if (this.sort) {
      return children.sort((a, b) => {
        return a.getLabel().localeCompare(b.getLabel());
      });
    } else {
      return children.sort((a, b) => {
        return a.getOffset() - b.getOffset();
      });
    }
  }

  sortRootChildren(children: OutlineNode[]) {
    return children.sort((a, b) => {
      const order = a.context.version == OpenApiVersion.V2 ? panelsListVer2 : panelsListVer3;
      return order.indexOf(a.getLabel()) - order.indexOf(b.getLabel());
    });
  }
}
