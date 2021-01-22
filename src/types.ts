import * as vscode from "vscode";
import { Node } from "./ast";

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

export interface IssuesByType {
  [id: string]: Issue[];
}

export interface Summary extends Grades {
  documentUri: string;
  subdocumentUris: string[];
}

export interface DocumentDecorations {
  [key: string]: vscode.DecorationOptions[];
}

export interface Audit {
  filename: string;
  summary: Summary;
  issues: IssuesByDocument;
  issuesByType: IssuesByType;
  diagnostics: vscode.DiagnosticCollection;
  decorations: DocumentDecorations;
}

export interface AuditContext {
  [uri: string]: Audit;
}

export interface AuditDiagnostic extends vscode.Diagnostic {
  id: string;
  pointer: string;
  issueIndex: number;
  issueUri: string;
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
}

export interface FixParameter {
  name: string;
  path: string;
  values: any[];
  source?: string;
}

export interface FixParameterSource {
  (issue: Issue, fix: Fix, parameter: FixParameter, entry: CacheEntry): any[];
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
  propertyHints: any;
}
