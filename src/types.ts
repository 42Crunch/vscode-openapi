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

export interface RuntimeContext {
  cache: Cache;
  diagnostics: vscode.DiagnosticCollection;
  bundlingDiagnostics: vscode.DiagnosticCollection;
}

export interface CacheEntry {
  uri: vscode.Uri;
  version: OpenApiVersion;
  root: Node;
  lastGoodRoot: Node;
  errors: any;
}
