import * as vscode from "vscode";
import { Node } from "@xliic/openapi-ast-node";

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

export interface Bundle {
  value: any;
  mapping: MappingNode;
  uris: Set<string>;
}

interface BundleError {
  errors: any;
}
export type BundleResult = Bundle | BundleError;

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
  audits: DocumentAudits;
  auditsBySubDocument: DocumentAudits;
  decorations: DocumentDecorations;
  diagnostics: vscode.DiagnosticCollection;
}

export interface AuditDiagnostic extends vscode.Diagnostic {
  id: string;
  pointer: string;
}

export interface InsertReplaceRenameFix extends Fix {
  type: FixType.Insert | FixType.Replace | FixType.RenameKey;
  fix: any;
}

export interface DeleteFix extends Fix {
  type: FixType.Delete;
}

export interface RegexReplaceFix extends Fix {
  type: FixType.RegexReplace;
  match: string;
  replace: string;
}

export enum FixType {
  Insert = "insert",
  Replace = "replace",
  Delete = "delete",
  RegexReplace = "regex-replace",
  RenameKey = "renameKey",
}

export interface Fix {
  problem: string[];
  type: FixType;
  title: string;
  pointer?: string;
  parameters?: FixParameter[];
  issueIndexes?: number[];
  issueURIs?: string[];
}

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
    bundle: BundleResult
  ): any[];
}

export interface FixContext {
  editor: vscode.TextEditor;
  edit: vscode.WorkspaceEdit;
  issues: Issue[];
  fix: InsertReplaceRenameFix | RegexReplaceFix | DeleteFix;
  bulk: boolean;
  snippet?: boolean;
  snippetParameters?: FixSnippetParameters;
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
