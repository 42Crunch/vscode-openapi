import { Parsed, Path } from "@xliic/preserving-json-yaml-parser";
import * as vscode from "vscode";
import { Audit, Issue } from "@xliic/common/audit";

import { JsonNodeValue } from "./json-utils";
import { DataDictionaryFormat } from "./platform/stores/platform-store";

export const configId = "openapi";
export const extensionQualifiedId = "42Crunch.vscode-openapi";
export enum OpenApiVersion {
  Unknown,
  V2,
  V3,
}

type Node = any;

export interface Mapping {
  uri: string;
  hash: string;
}

export interface MappingNode {
  value: Mapping | undefined;
  children: {
    [key: string]: MappingNode;
  };
}

export type DocumentToObjectParser = (document: vscode.TextDocument) => any;

export interface Bundle {
  value: any;
  mapping: MappingNode;
  document: vscode.TextDocument;
  documents: Set<vscode.TextDocument>;
}

export interface BundlingError {
  message: string;
  pointer: string;
  code: string;
  rejectedHost?: string;
}

export interface BundlingFailure {
  errors: Map<string, BundlingError[]>;
  document: vscode.TextDocument;
  documents: Set<vscode.TextDocument>;
}
export type BundleResult = Bundle | BundlingFailure;

export interface IssuesByDocument {
  [uri: string]: Issue[];
}

export interface DocumentDecorations {
  [uri: string]: vscode.DecorationOptions[];
}

export interface DocumentAudits {
  [uri: string]: Audit;
}

export interface PendingAudits {
  [uri: string]: boolean;
}

export interface AuditContext {
  auditsByMainDocument: DocumentAudits;
  auditsByDocument: DocumentAudits;
  decorations: DocumentDecorations;
  diagnostics: vscode.DiagnosticCollection;
  auditTempDirectories: Record<string, string>;
}

export interface AuditDiagnostic extends vscode.Diagnostic {
  id: string;
  pointer: string;
}

export interface DataDictionaryDiagnostic extends vscode.Diagnostic {
  id: string;
  format: string;
  node: object;
  property: string;
  path: Path;
}

export enum FixType {
  Insert = "insert",
  Replace = "replace",
  Delete = "delete",
  RegexReplace = "regex-replace",
  RenameKey = "renameKey",
}

export interface BaseFix {
  problem: string[];
  type: FixType;
  title: string;
  pointer?: string;
  parameters?: FixParameter[];
  issueIndexes?: number[];
  issueURIs?: string[];
}

export interface InsertReplaceRenameFix extends BaseFix {
  type: FixType.Insert | FixType.Replace | FixType.RenameKey;
  fix: any;
}

export interface DeleteFix extends BaseFix {
  type: FixType.Delete;
}

export interface RegexReplaceFix extends BaseFix {
  type: FixType.RegexReplace;
  match: string;
  replace: string;
}

export type Fix = InsertReplaceRenameFix | DeleteFix | RegexReplaceFix;

export interface FixParameter {
  name: string;
  path: string;
  values?: any[];
  type?: string;
  source?: string;
  fixIndex?: number;
}

export interface FixParameterSource {
  (
    issue: Issue,
    fix: Fix,
    parameter: FixParameter,
    version: OpenApiVersion,
    bundle: BundleResult,
    document: vscode.TextDocument,
    formatMap?: Map<string, DataDictionaryFormat>
  ): any[];
}

export interface FixContext {
  editor: vscode.TextEditor;
  edit: vscode.WorkspaceEdit;
  issues: Issue[];
  fix: Fix;
  bulk: boolean;
  snippet?: boolean;
  snippetParameters?: FixSnippetParameters;
  skipConfirmation?: boolean;
  auditContext: AuditContext;
  version: OpenApiVersion;
  bundle: BundleResult;
  root: Parsed;
  target: JsonNodeValue;
  anchor?: JsonNodeValue;
  document: vscode.TextDocument;
  dropBrackets?: number[];
  formatMap?: Map<string, DataDictionaryFormat>;
  rangesToRemove?: vscode.Range[];
  positionsToInsert?: [string, vscode.Position][];
  pointersToRemove?: Set<string>;
}

export interface FixSnippetParameters {
  snippet?: vscode.SnippetString;
  location?: vscode.Position;
  dropLine?: boolean;
}
