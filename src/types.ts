import * as vscode from "vscode";
import { Node } from "./ast";
import { Cache } from "./cache";

export const configId = "openapi";
export const extensionQualifiedId = "42Crunch.vscode-openapi";
export enum OpenApiVersion {
  Unknown,
  V2,
  V3,
}

export interface Mapping {
  file: string;
  hash: string;
}

export interface MappingNode {
  value: Mapping;
  children: {
    [key: string]: MappingNode;
  };
}

export interface CacheEntry {
  document: vscode.TextDocument;
  uri: vscode.Uri;
  version: OpenApiVersion;
  astRoot: Node;
  lastGoodAstRoot: Node;
  parsed: any;
  errors: any;
  bundled: any;
  bundledErorrs: any;
  bundledUris: any;
  bundledMapping: any;
}
