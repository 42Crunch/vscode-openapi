import * as vscode from "vscode";
import { Node } from "@xliic/openapi-ast-node";
import { version } from "react";

export const configId = "openapi";
export const extensionQualifiedId = "42Crunch.vscode-openapi";
export enum OpenApiVersion {
  Unknown,
  V2,
  V3,
}

export interface Mapping {
  uri: string;
  hash: string;
}

export interface MappingNode {
  value: Mapping;
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

interface Grade {
  value: number;
  max: number;
}

export interface Grades {
  datavalidation: Grade;
  security: Grade;
  oasconformance: Grade;
  all: number;
  errors: boolean;
  invalid: boolean;
}

export interface ReportedIssue {
  id: string;
  description: string;
  pointer: string;
  score: number;
  displayScore: string;
  criticality: number;
}

export interface Issue extends ReportedIssue {
  lineNo: number;
  range: vscode.Range;
  documentUri: string;
}

export interface IssuesByDocument {
  [uri: string]: Issue[];
}

export interface Summary extends Grades {
  documentUri: string;
  subdocumentUris: string[];
}

export interface DocumentDecorations {
  [uri: string]: vscode.DecorationOptions[];
}

export interface DocumentAudits {
  [uri: string]: Audit;
}

export interface Audit {
  filename: string;
  summary: Summary;
  issues: IssuesByDocument;
}

export interface AuditContext {
  auditsByMainDocument: DocumentAudits;
  auditsByDocument: DocumentAudits;
  decorations: DocumentDecorations;
  diagnostics: vscode.DiagnosticCollection;
}

export interface AuditDiagnostic extends vscode.Diagnostic {
  id: string;
  pointer: string;
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
    document: vscode.TextDocument
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
  pointer: string;
  root: Node;
  target: Node;
  document: vscode.TextDocument;
}

export interface FixSnippetParameters {
  snippet: vscode.SnippetString;
  location?: vscode.Position;
}
