import * as vscode from 'vscode';
import * as quickfixes from './quickfixes.json';
import { AuditContext, AuditDiagnostic } from './types';
import { parserOptions } from '../parser-options';
import { parse, Node } from '../ast';
import { createDiagnostics } from './diagnostic';
import { createDecorations, setDecorations } from './decoration';
import { ReportWebView } from './report';
import { deleteJsonNode, deleteYamlNode, getFixAsJsonString, getFixAsYamlString, 
  insertJsonNode, insertYamlNode, renameKeyNode, replaceJsonNode, replaceYamlNode } from '../util';

async function quickFixCommand(
  editor: vscode.TextEditor,
  diagnostic: AuditDiagnostic,
  fix: any,
  auditContext: AuditContext,
) {
  const document = editor.document;
  const pointer = diagnostic.pointer;
  const root = safeParse(document.getText(), document.languageId);

  if (fix.type === 'insert') {
    let value: string, position: vscode.Position;
    if (document.languageId === 'json') {
      value = getFixAsJsonString(root, pointer, fix.type, fix.fix, fix.parameters, true);
      [value, position] = insertJsonNode(document, root, pointer, value);
    }
    else {
      value = getFixAsYamlString(root, pointer, fix.type, fix.fix, fix.parameters, true);
      [value, position] = insertYamlNode(document, root, pointer, value);
    }
    await editor.insertSnippet(new vscode.SnippetString(value), position);
  }
  else if (fix.type === 'replace') {
    let value: string, range: vscode.Range;
    if (document.languageId === 'json') {
      value = getFixAsJsonString(root, pointer, fix.type, fix.fix, fix.parameters, false);
      [value, range] = replaceJsonNode(document, root, pointer, value);
    }
    else {
      value = getFixAsYamlString(root, pointer, fix.type, fix.fix, fix.parameters, false);
      [value, range] = replaceYamlNode(document, root, pointer, value);
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, value);
    await vscode.workspace.applyEdit(edit);
  }
  else if (fix.type === 'renameKey') {
    let value: string;
    if (document.languageId === 'json') {
      value = getFixAsJsonString(root, pointer, fix.type, fix.fix, fix.parameters, false);
    }
    else {
      value = getFixAsYamlString(root, pointer, fix.type, fix.fix, fix.parameters, false);
    }
    const range = renameKeyNode(document, root, pointer);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, value);
    await vscode.workspace.applyEdit(edit);
  }
  else if (fix.type === 'delete') {
    let range: vscode.Range;
    if (document.languageId === 'json') {
      range = deleteJsonNode(document, root, pointer);
    }
    else {
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
  const problems = new Set<string>();
  for (const fix of quickfixes.fixes) {
    if (problems.has(fix.problem)) {
      continue; // Otherwise it will cause registration failure
    }
    problems.add(fix.problem);
    vscode.commands.registerTextEditorCommand(
      `openapi.quickFix-${fix.problem}`,
      async (editor, edit, diagnostic: AuditDiagnostic) => quickFixCommand(editor, diagnostic, fix, auditContext),
    );
  }

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

    // for (const diagnostic of context.diagnostics) {
    //   for (const fix of quickfixes.fixes) {
    //     const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
    //     action.command = {
    //       arguments: [diagnostic],
    //       command: `openapi.quickFix-${fix.problem}`,
    //       title: fix.title
    //     };
    //     action.diagnostics = [diagnostic];
    //     action.isPreferred = true;
    //     result.push(action);
    //   }
    // }

    for (const diagnostic of context.diagnostics) {
      const auditDiagnostic = <AuditDiagnostic>diagnostic;
      if (!auditDiagnostic.issueIndex) {
        continue;
      }
      //console.info('pointer = ' + auditDiagnostic.pointer + ', problem = ' + auditDiagnostic.id);
      for (const fix of quickfixes.fixes) {
        if (auditDiagnostic.id === fix.problem) {
          //console.info('pointer = ' + auditDiagnostic.pointer + ', problem = ' + fix.problem);
          const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
          action.command = {
            arguments: [diagnostic],
            command: `openapi.quickFix-${fix.problem}`,
            title: fix.title,
          };
          action.diagnostics = [diagnostic];
          action.isPreferred = true;
          result.push(action);
        }
      }
    }
    return result;
  }
}

function safeParse(text: string, languageId: string): Node {
  const [root, errors] = parse(text, languageId, parserOptions);
  if (errors.length) {
    throw new Error("Can't parse OpenAPI file");
  }
  return root;
}
