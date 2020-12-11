import * as vscode from 'vscode';
import * as quickfixes from './quickfixes.json';
import { AuditContext, AuditDiagnostic } from './types';
import { parserOptions } from '../parser-options';
import { parse, Node } from '../ast';
import { createDiagnostics } from './diagnostic';
import { createDecorations, setDecorations } from './decoration';
import { ReportWebView } from './report';
import { JsonAstEditHandler } from '../edit/json';
import { YamlAstEditHandler } from '../edit/yaml';
import { AstEditHandler } from '../edit/types';

async function quickFixCommand(
  editor: vscode.TextEditor,
  diagnostic: AuditDiagnostic,
  fix: any,
  auditContext: AuditContext,
) {
  const handler = getAstEditHandler(editor, false);
  handler.apply(diagnostic.pointer, fix);
  await handler.finish();

  const uri = editor.document.uri.toString();
  const audit = auditContext[uri];
  // update audit and refresh diagnostics and decorations
  if (audit) {
    const root2 = safeParse(editor.document.getText(), editor.document.languageId);
    // clear current diagnostics
    audit.diagnostics.dispose();
    const issues = audit.issues[uri];
    // remove the issue resolved by the fix
    issues.splice(diagnostic.issueIndex, 1);
    // update range for all issues (since the fix has potentially changed line numbering in the file)
    audit.issues[uri] = issues.map((issue) => ({
      ...issue,
      range: range(editor.document, root2, issue.pointer),
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

function getAstEditHandler(editor: vscode.TextEditor, bulk: boolean): AstEditHandler {
  return editor.document.languageId === 'json'
    ? new JsonAstEditHandler(editor, bulk)
    : new YamlAstEditHandler(editor, bulk);
}
