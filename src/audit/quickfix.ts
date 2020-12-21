import * as vscode from 'vscode';
import * as quickfixes from './quickfixes-latest.json';
import { AuditContext, AuditDiagnostic } from './types';
import { parse, Node } from '../ast';
import { createDiagnostics } from './diagnostic';
import { createDecorations, setDecorations } from './decoration';
import { ReportWebView } from './report';
import {
  safeParse,
  deleteJsonNode,
  deleteYamlNode,
  getFixAsJsonString,
  getFixAsYamlString,
  insertJsonNode,
  insertYamlNode,
  renameKeyNode,
  replaceJsonNode,
  replaceYamlNode,
} from '../util';

async function quickFixCommand(
  editor: vscode.TextEditor,
  diagnostic: AuditDiagnostic,
  fix: object,
  auditContext: AuditContext,
) {
  let pointer = diagnostic.pointer;
  let fixType = fix['type'];
  const document = editor.document;
  const root = safeParse(document.getText(), document.languageId);
  let fixJson = fix['fix'] ? JSON.parse(JSON.stringify(fix['fix'])) : null; // Perform deep copy
  const parameters = fix['parameters'];

  // Check if one single key already exists and needs to be replaced
  const keys = fixJson ? Object.keys(fixJson) : [];
  const target = root.find(pointer);
  if (target.isObject() && keys.length === 1) {
    const insertingKey = keys[0];
    for (let child of target.getChildren()) {
      if (child.getKey() === insertingKey) {
        fixType = 'replace';
        pointer = pointer + '/' + insertingKey;
        fixJson = fixJson[insertingKey];
        break;
      }
    }
  }

  if (fixType === 'insert') {
    let value: string, position: vscode.Position;
    if (document.languageId === 'json') {
      value = getFixAsJsonString(root, pointer, fixType, fixJson, parameters, true);
      [value, position] = insertJsonNode(document, root, pointer, value);
    } else {
      value = getFixAsYamlString(root, pointer, fixType, fixJson, parameters, true);
      [value, position] = insertYamlNode(document, root, pointer, value);
    }
    await editor.insertSnippet(new vscode.SnippetString(value), position);
  } else if (fixType === 'replace') {
    let value: string, range: vscode.Range;
    if (document.languageId === 'json') {
      value = getFixAsJsonString(root, pointer, fixType, fixJson, parameters, false);
      [value, range] = replaceJsonNode(document, root, pointer, value);
    } else {
      value = getFixAsYamlString(root, pointer, fixType, fixJson, parameters, false);
      [value, range] = replaceYamlNode(document, root, pointer, value);
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, value);
    await vscode.workspace.applyEdit(edit);
  } else if (fixType === 'renameKey') {
    let value: string;
    if (document.languageId === 'json') {
      value = getFixAsJsonString(root, pointer, fixType, fixJson, parameters, false);
    } else {
      value = getFixAsYamlString(root, pointer, fixType, fixJson, parameters, false);
    }
    const range = renameKeyNode(document, root, pointer);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, value);
    await vscode.workspace.applyEdit(edit);
  } else if (fixType === 'delete') {
    let range: vscode.Range;
    if (document.languageId === 'json') {
      range = deleteJsonNode(document, root, pointer);
    } else {
      range = deleteYamlNode(document, root, pointer);
    }
    const edit = new vscode.WorkspaceEdit();
    edit.delete(document.uri, range);
    await vscode.workspace.applyEdit(edit);
  }

  const uri = document.uri.toString();
  const audit = auditContext[uri];
  // update audit and refresh diagnostics and decorations
  if (audit) {
    const root2 = safeParse(document.getText(), document.languageId);
    // clear current diagnostics
    audit.diagnostics.dispose();
    const issues = audit.issues[uri];
    // remove the issue resolved by the fix
    issues.splice(diagnostic.issueIndex, 1);
    // update range for all issues (since the fix has potentially changed line numbering in the file)
    audit.issues[uri] = issues.map((issue) => ({
      ...issue,
      range: range(document, root2, issue.pointer),
    }));

    // rebuild diagnostics and decorations and refresh report
    audit.diagnostics = createDiagnostics(audit.filename, audit.issues, editor);
    audit.decorations = createDecorations(uri.toString(), audit.issues);
    setDecorations(editor, auditContext);
    ReportWebView.showIfVisible(audit);
  }
}

function range(document: vscode.TextDocument, root: Node, pointer: string) {
  const markerNode = root.find('/openapi') || root.find('/swagger');
  const node = pointer === '' ? markerNode : root.find(pointer);
  if (node) {
    const [start, end] = node.getRange();
    const position = document.positionAt(start);
    const line = document.lineAt(position.line);
    return new vscode.Range(
      new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
      new vscode.Position(position.line, line.range.end.character),
    );
  } else {
    throw new Error(`Unable to locate node: ${pointer}`);
  }
}

export function registerQuickfixes(context: vscode.ExtensionContext, auditContext: AuditContext) {
  vscode.commands.registerTextEditorCommand(
    'openapi.simpleQuckFix',
    async (editor, edit, diagnostic: AuditDiagnostic, fix) => quickFixCommand(editor, diagnostic, fix, auditContext),
  );

  vscode.languages.registerCodeActionsProvider('yaml', new AuditCodeActions(auditContext), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });

  vscode.languages.registerCodeActionsProvider('json', new AuditCodeActions(auditContext), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });
}

export class AuditCodeActions implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
  auditContext: AuditContext;

  constructor(auditContext: AuditContext) {
    this.auditContext = auditContext;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const result: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      const auditDiagnostic = <AuditDiagnostic>diagnostic;
      if (!auditDiagnostic.hasOwnProperty('issueIndex')) {
        continue;
      }

      // TODO optimize fixes lookup, build map of IDs perhaps?
      for (const fix of quickfixes.fixes) {
        for (const problemId of fix.problem) {
          if (auditDiagnostic.id === problemId) {
            const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
            action.command = {
              arguments: [diagnostic, fix],
              command: 'openapi.simpleQuckFix',
              title: fix.title,
            };
            action.diagnostics = [diagnostic];
            action.isPreferred = true;
            result.push(action);
          }
        }
      }
    }
    return result;
  }
}
