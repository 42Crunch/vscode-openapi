import * as vscode from 'vscode';

export const configId = 'openapi';
export const extensionQualifiedId = '42Crunch.vscode-openapi';
export enum OpenApiVersion {
  Unknown,
  V2,
  V3,
}

export interface RuntimeContext {
  didChangeEditor: vscode.Event<[vscode.TextEditor, OpenApiVersion]>;
  diagnostics: vscode.DiagnosticCollection;
  bundlingDiagnostics: vscode.DiagnosticCollection;
}
