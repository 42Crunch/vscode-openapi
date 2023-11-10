import * as vscode from "vscode";
import { Container, getLocation, Location } from "@xliic/preserving-json-yaml-parser";
import { OpenApiVersion } from "../../types";
import { encodeJsonPointerSegment, getPointerLastSegment } from "../../pointer";

export interface OutlineContext {
  readonly version: OpenApiVersion;
  readonly documentUri: string;
  search: string | undefined;
}

export interface OutlineNode {
  readonly parent: OutlineNode | undefined;
  readonly id: string;
  readonly item: vscode.TreeItem;
  readonly icon?: { dark: string; light: string } | string | undefined;
  readonly node: any;
  readonly contextValue?: string;
  readonly location: Location | undefined;
  readonly context: OutlineContext;
  readonly searchable: boolean;
  skipDeepSearch: boolean;

  getChildren(): OutlineNode[];
  getAndFilterChildren(): OutlineNode[];
  getOffset(): number;
  getLabel(): string;
  passFilter(value: string): boolean;
}

export const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

export abstract class AbstractOutlineNode implements OutlineNode {
  readonly item: vscode.TreeItem;
  contextValue?: string;
  location: Location | undefined;
  icon: { dark: string; light: string } | string | undefined;
  searchable: boolean; // false if not affected by search (always visible)
  skipDeepSearch: boolean;

  constructor(
    readonly parent: OutlineNode | undefined,
    readonly id: string,
    readonly title: string,
    readonly collapsible: vscode.TreeItemCollapsibleState,
    readonly node: any,
    readonly context: OutlineContext
  ) {
    this.item = new vscode.TreeItem(title, getCollapsibleState(parent, id, collapsible, node));
    if (this.parent) {
      const key = getPointerLastSegment(this.id);
      this.location = getLocation(this.parent.node as Container, key);
    }
    this.item.command = this.getCommand();
    this.searchable = true;
    this.skipDeepSearch = parent?.skipDeepSearch || false;
  }

  getChildren(): OutlineNode[] {
    return [];
  }

  getAndFilterChildren(): OutlineNode[] {
    const children = this.getChildren();
    const searchValue = this.context.search?.toLowerCase();
    if (!searchValue || this.parent?.skipDeepSearch) {
      return children;
    }
    const res = [];
    for (const child of children) {
      // Pass filtering if node's passFilter API returns true
      if (child.passFilter(searchValue)) {
        res.push(child);
        if (child.contextValue == "path" || child.contextValue == "operation") {
          child.skipDeepSearch = true;
        }
        // or node has a descendant that meets search criteria
      } else if (child.getAndFilterChildren().length > 0) {
        res.push(child);
      }
    }
    return res;
  }

  passFilter(value: string): boolean {
    // Pass filtering if node is configured as not searchable (paths, components, ...)
    // or node's tree title includes search value
    return !this.searchable || this.getLabel().toLowerCase().includes(value);
  }

  getCommand(): vscode.Command | undefined {
    const documentUri = this.context.documentUri;
    const [editor] = vscode.window.visibleTextEditors.filter(
      (editor) => editor.document.uri.toString() === documentUri
    );
    if (editor) {
      if (this.location) {
        const { start, end } = this.location.key ? this.location.key : this.location.value;
        return {
          command: "openapi.goToLine",
          title: "",
          arguments: [
            documentUri,
            new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end)),
          ],
        };
      }
    }
    return undefined;
  }

  updateLocation(location: Location) {
    this.location = location;
    this.item.command = this.getCommand();
  }

  getOffset(): number {
    if (this.location) {
      const { start } = this.location.key ? this.location.key : this.location.value;
      return start;
    }
    return -1;
  }

  getLabel(): string {
    return this.item.label as string;
  }

  nextPointer(segment: string | number): string {
    if (typeof segment === "string") {
      return this.id + "/" + encodeJsonPointerSegment(segment);
    } else {
      return this.id + "/" + segment;
    }
  }

  getChildrenByKey(
    getNode: (key: string, pointer: string, node: any) => OutlineNode | undefined
  ): OutlineNode[] {
    const res = [];
    if (this.node) {
      for (const key of Object.keys(this.node)) {
        const result = getNode(key, this.nextPointer(key), this.node[key]);
        if (result) {
          res.push(result);
        }
      }
    }
    return res;
  }

  getChildrenById(
    getNode: (id: number, pointer: string, node: any) => OutlineNode | undefined
  ): OutlineNode[] {
    const res = [];
    if (this.node) {
      let id = 0;
      for (const item of this.node) {
        const result = getNode(id, this.nextPointer(id), item);
        if (result) {
          res.push(result);
        }
        id += 1;
      }
    }
    return res;
  }
}

function getCollapsibleState(
  parent: OutlineNode | undefined,
  id: string,
  defaultState: vscode.TreeItemCollapsibleState,
  node: any
): vscode.TreeItemCollapsibleState {
  if (id === "/tags" || parent?.id === "/tags") {
    return defaultState;
  }
  return node === undefined ? vscode.TreeItemCollapsibleState.None : defaultState;
}
