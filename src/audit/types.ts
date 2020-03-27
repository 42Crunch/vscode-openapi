import * as vscode from 'vscode';

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
}

export interface Summary extends Grades {
  documentUri: string;
  subdocumentUris: string[];
}

export interface Audit {
  summary: Summary;
  issues: { [uri: string]: any[] };
  diagnostics: vscode.DiagnosticCollection;
  decorations: { [documentUri: string]: vscode.DecorationOptions[] };
}

export interface AuditContext {
  [uri: string]: Audit;
}
