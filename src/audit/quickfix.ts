/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as quickfixes from "./quickfixes.json";
import { AuditContext, AuditDiagnostic } from "./types";
import { Node } from "../ast";
import { createDiagnostics } from "./diagnostic";
import { createDecorations, setDecorations } from "./decoration";
import { ReportWebView } from "./report";
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
} from "../util";

enum FixType {
  Insert = "insert",
  Replace = "replace",
  Delete = "delete",
  RegexReplace = "regex-replace",
  RenameKey = "renameKey",
}

interface Fix {
  problem: string[];
  type: FixType;
  title: string;
  pointer?: string;
}

interface FixParameter {
  name: string;
  path: string;
  values: any[];
}

interface InsertReplaceRenameFix extends Fix {
  type: FixType.Insert | FixType.Replace | FixType.RenameKey;
  fix: any;
  parameters?: FixParameter[];
}

interface DeleteFix extends Fix {
  type: FixType.Delete;
}

interface RegexReplaceFix extends Fix {
  type: FixType.RegexReplace;
  match: string;
  replace: string;
}

function clone(value: any) {
  // deep copy
  return JSON.parse(JSON.stringify(value));
}

async function fixRegexReplace(
  document: vscode.TextDocument,
  fix: RegexReplaceFix,
  pointer: string,
  root: Node,
  target: Node
) {
  const currentValue = target.getValue();
  if (typeof currentValue !== "string") {
    return;
  }
  const newValue = currentValue.replace(new RegExp(fix.match, "g"), fix.replace);
  let value: string, range: vscode.Range;
  if (document.languageId === "json") {
    [value, range] = replaceJsonNode(document, root, pointer, '"' + newValue + '"');
  } else {
    [value, range] = replaceYamlNode(document, root, pointer, newValue);
  }
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, value);
  await vscode.workspace.applyEdit(edit);
}

async function fixInsert(
  editor: vscode.TextEditor,
  document: vscode.TextDocument,
  fix: InsertReplaceRenameFix,
  pointer: string,
  root: Node
) {
  let value: string, position: vscode.Position;
  if (document.languageId === "json") {
    value = getFixAsJsonString(root, pointer, fix.type, clone(fix.fix), fix.parameters, true);
    [value, position] = insertJsonNode(document, root, pointer, value);
  } else {
    value = getFixAsYamlString(root, pointer, fix.type, clone(fix.fix), fix.parameters, true);
    [value, position] = insertYamlNode(document, root, pointer, value);
  }
  await editor.insertSnippet(new vscode.SnippetString(value), position);
}

async function fixReplace(
  document: vscode.TextDocument,
  fix: InsertReplaceRenameFix,
  pointer: string,
  root: Node
) {
  let value: string, range: vscode.Range;
  if (document.languageId === "json") {
    value = getFixAsJsonString(root, pointer, fix.type, clone(fix.fix), fix.parameters, false);
    [value, range] = replaceJsonNode(document, root, pointer, value);
  } else {
    value = getFixAsYamlString(root, pointer, fix.type, clone(fix.fix), fix.parameters, false);
    [value, range] = replaceYamlNode(document, root, pointer, value);
  }
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, value);
  await vscode.workspace.applyEdit(edit);
}

async function fixRenameKey(
  document: vscode.TextDocument,
  fix: InsertReplaceRenameFix,
  pointer: string,
  root: Node
) {
  let value: string;
  if (document.languageId === "json") {
    value = getFixAsJsonString(root, pointer, fix.type, clone(fix.fix), fix.parameters, false);
  } else {
    value = getFixAsYamlString(root, pointer, fix.type, clone(fix.fix), fix.parameters, false);
  }
  const range = renameKeyNode(document, root, pointer);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, range, value);
  await vscode.workspace.applyEdit(edit);
}

async function fixDelete(document: vscode.TextDocument, pointer: string, root: Node) {
  let range: vscode.Range;
  if (document.languageId === "json") {
    range = deleteJsonNode(document, root, pointer);
  } else {
    range = deleteYamlNode(document, root, pointer);
  }
  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, range);
  await vscode.workspace.applyEdit(edit);
}

function transformInsertToReplaceIfExists(
  target: Node,
  pointer: string,
  fix: InsertReplaceRenameFix
): [string, InsertReplaceRenameFix] {
  const keys = Object.keys(fix.fix);
  if (target.isObject() && keys.length === 1) {
    const insertingKey = keys[0];
    for (let child of target.getChildren()) {
      if (child.getKey() === insertingKey) {
        return [
          `${pointer}/${insertingKey}`,
          {
            problem: fix.problem,
            title: fix.title,
            type: FixType.Replace,
            fix: fix.fix[insertingKey],
          },
        ];
      }
    }
  }
  return [null, null];
}

async function quickFixCommand(
  editor: vscode.TextEditor,
  diagnostic: AuditDiagnostic,
  fix: InsertReplaceRenameFix | RegexReplaceFix | DeleteFix,
  auditContext: AuditContext
) {
  // if fix.pointer exists, append it to diagnostic.pointer
  const pointer = fix.pointer ? `${diagnostic.pointer}${fix.pointer}` : diagnostic.pointer;
  const root = safeParse(editor.document.getText(), editor.document.languageId);
  const target = root.find(pointer);
  const document = editor.document;

  switch (fix.type) {
    case FixType.Insert:
      const [pointer2, fix2] = transformInsertToReplaceIfExists(target, pointer, fix);
      if (pointer2) {
        await fixReplace(document, fix2, pointer2, root);
      } else {
        await fixInsert(editor, document, fix, pointer, root);
      }
      break;
    case FixType.Replace:
      await fixReplace(document, fix, pointer, root);
      break;
    case FixType.RegexReplace:
      await fixRegexReplace(document, fix, pointer, root, target);
      break;
    case FixType.RenameKey:
      await fixRenameKey(document, fix, pointer, root);
      break;
    case FixType.Delete:
      await fixDelete(document, pointer, root);
  }

  // update diagnostics
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
  const markerNode = root.find("/openapi") || root.find("/swagger");
  const node = pointer === "" ? markerNode : root.find(pointer);
  if (node) {
    const [start, end] = node.getRange();
    const position = document.positionAt(start);
    const line = document.lineAt(position.line);
    return new vscode.Range(
      new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
      new vscode.Position(position.line, line.range.end.character)
    );
  } else {
    throw new Error(`Unable to locate node: ${pointer}`);
  }
}

export function registerQuickfixes(context: vscode.ExtensionContext, auditContext: AuditContext) {
  vscode.commands.registerTextEditorCommand(
    "openapi.simpleQuckFix",
    async (editor, edit, diagnostic: AuditDiagnostic, fix) =>
      quickFixCommand(editor, diagnostic, fix, auditContext)
  );

  vscode.languages.registerCodeActionsProvider("yaml", new AuditCodeActions(auditContext), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });

  vscode.languages.registerCodeActionsProvider("json", new AuditCodeActions(auditContext), {
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
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const result: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      const auditDiagnostic = <AuditDiagnostic>diagnostic;
      if (!auditDiagnostic.hasOwnProperty("issueIndex")) {
        continue;
      }

      // TODO optimize fixes lookup, build map of IDs perhaps?
      for (const fix of quickfixes.fixes) {
        for (const problemId of fix.problem) {
          if (auditDiagnostic.id === problemId) {
            const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
            action.command = {
              arguments: [diagnostic, fix],
              command: "openapi.simpleQuckFix",
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
