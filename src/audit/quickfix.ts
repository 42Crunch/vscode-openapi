/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as quickfixes from "./quickfixes.json";
import {
  Audit,
  AuditContext,
  AuditDiagnostic,
  DeleteFix,
  FixContext,
  FixParameter,
  FixSnippetParameters,
  InsertReplaceRenameFix,
  Issue,
  OpenApiVersion,
  RegexReplaceFix,
} from "../types";
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
  clone,
} from "../util";
import { Cache } from "../cache";
import { FixType } from "../types";

const registeredQuickFixes: { [key: string]: any } = {};

function fixRegexReplace(context: FixContext) {
  const document = context.document;
  const fix = <RegexReplaceFix>context.fix;
  const target = context.target;
  const currentValue = target.getValue();
  if (typeof currentValue !== "string") {
    return;
  }
  context.snippet = false;
  const newValue = currentValue.replace(new RegExp(fix.match, "g"), fix.replace);
  let value: string, range: vscode.Range;
  if (document.languageId === "json") {
    [value, range] = replaceJsonNode(context, '"' + newValue + '"');
  } else {
    [value, range] = replaceYamlNode(context, newValue);
  }
  const edit = getWorkspaceEdit(context);
  edit.replace(document.uri, range, value);
}

function fixInsert(context: FixContext) {
  const document = context.document;
  let value: string, position: vscode.Position;
  context.snippet = !context.bulk;
  if (document.languageId === "json") {
    [value, position] = insertJsonNode(context, getFixAsJsonString(context));
  } else {
    [value, position] = insertYamlNode(context, getFixAsYamlString(context));
  }
  if (context.snippet) {
    context.snippetParameters = {
      snippet: new vscode.SnippetString(value),
      location: position,
    };
  } else {
    const edit = getWorkspaceEdit(context);
    if (context.bulk) {
      edit.insert(document.uri, position, value, {
        needsConfirmation: true,
        label: context.fix.title,
      });
    } else {
      edit.insert(document.uri, position, value);
    }
  }
}

function fixReplace(context: FixContext) {
  const document = context.document;
  let value: string, range: vscode.Range;
  context.snippet = false;
  if (document.languageId === "json") {
    [value, range] = replaceJsonNode(context, getFixAsJsonString(context));
  } else {
    [value, range] = replaceYamlNode(context, getFixAsYamlString(context));
  }
  const edit = getWorkspaceEdit(context);
  edit.replace(document.uri, range, value);
}

function fixRenameKey(context: FixContext) {
  const document = context.document;
  let value: string;
  context.snippet = false;
  if (document.languageId === "json") {
    value = getFixAsJsonString(context);
  } else {
    value = getFixAsYamlString(context);
  }
  const range = renameKeyNode(context);
  const edit = getWorkspaceEdit(context);
  edit.replace(document.uri, range, value);
}

function fixDelete(context: FixContext) {
  const document = context.document;
  let range: vscode.Range;
  context.snippet = false;
  if (document.languageId === "json") {
    range = deleteJsonNode(context);
  } else {
    range = deleteYamlNode(context);
  }
  const edit = getWorkspaceEdit(context);
  edit.delete(document.uri, range);
}

function transformInsertToReplaceIfExists(context: FixContext): boolean {
  const target = context.target;
  const pointer = context.pointer;
  const fix = <InsertReplaceRenameFix>context.fix;

  const keys = Object.keys(fix.fix);
  if (target.isObject() && keys.length === 1) {
    const insertingKey = keys[0];
    for (let child of target.getChildren()) {
      if (child.getKey() === insertingKey) {
        context.pointer = `${pointer}/${insertingKey}`;
        context.target = context.root.find(context.pointer);
        context.fix = {
          problem: fix.problem,
          title: fix.title,
          type: FixType.Replace,
          fix: fix.fix[insertingKey],
        };
        return true;
      }
    }
  }
  return false;
}

async function quickFixCommand(
  editor: vscode.TextEditor,
  issues: Issue[],
  fix: InsertReplaceRenameFix | RegexReplaceFix | DeleteFix,
  auditContext: AuditContext,
  cache: Cache
) {
  let edit: vscode.WorkspaceEdit = null;
  let snippetParameters: FixSnippetParameters = null;
  const document = editor.document;
  const uri = document.uri.toString();
  let version: OpenApiVersion = null;
  let bundle: any = null;

  if (uri in auditContext) {
    version = cache.getDocumentVersion(document);
    bundle = await cache.getDocumentBundle(document);
  } else {
    for (const audit of Object.values(auditContext)) {
      // TODO: make final decision is it worth supporting multiple audits?
      if (uri in audit.issues) {
        version = cache.getDocumentVersionByDocumentUri(audit.summary.documentUri);
        bundle = await cache.getDocumentBundleByDocumentUri(audit.summary.documentUri);
        break;
      }
    }
  }

  const issuesByPointer = getIssuesByPointers(issues);
  // Single fix has one issue in the array
  // Assembled fix means all issues share same pointer, but have different ids
  // Bulk means all issues share same id, but have different pointers
  const bulk = Object.keys(issuesByPointer).length > 1;

  for (const issuePointer of Object.keys(issuesByPointer)) {
    // if fix.pointer exists, append it to diagnostic.pointer
    const pointer = fix.pointer ? `${issuePointer}${fix.pointer}` : issuePointer;
    const root = safeParse(editor.document.getText(), editor.document.languageId);
    const target = root.find(pointer);

    const context: FixContext = {
      editor: editor,
      edit: edit,
      issues: bulk ? issuesByPointer[issuePointer] : issues,
      fix: clone(fix),
      bulk: bulk,
      auditContext: auditContext,
      version: version,
      bundle: bundle,
      pointer: pointer,
      root: root,
      target: target,
      document: document,
    };

    switch (fix.type) {
      case FixType.Insert:
        if (transformInsertToReplaceIfExists(context)) {
          fixReplace(context);
        } else {
          fixInsert(context);
        }
        break;
      case FixType.Replace:
        fixReplace(context);
        break;
      case FixType.RegexReplace:
        fixRegexReplace(context);
        break;
      case FixType.RenameKey:
        fixRenameKey(context);
        break;
      case FixType.Delete:
        fixDelete(context);
    }

    // A fix handler above initialized workspace edit lazily with updates
    // Remember it here to pass to other fix handlers in case of bulk fix feature
    // They will always udate the same edit instance
    if (context.edit) {
      edit = context.edit;
    }
    if (context.snippetParameters) {
      snippetParameters = context.snippetParameters;
    }
  }

  // Apply only if has anything to apply
  if (edit) {
    await vscode.workspace.applyEdit(edit);
  } else if (snippetParameters) {
    await editor.insertSnippet(snippetParameters.snippet, snippetParameters.location);
  }

  // update diagnostics
  const audits = auditContext[uri]
    ? [auditContext[uri]]
    : Object.values(auditContext).filter((audit: Audit) => uri in audit.issues);

  // create temp hash set to have constant time complexity while searching for fixed issues
  const fixedIssueIds: Set<string> = new Set();
  const fixedIssueIdAndPointers: Set<string> = new Set();
  issues.forEach((issue: Issue) => {
    fixedIssueIds.add(issue.id);
    fixedIssueIdAndPointers.add(issue.id + issue.pointer);
  });

  // update audit and refresh diagnostics and decorations
  for (const audit of audits) {
    const root2 = safeParse(document.getText(), document.languageId);
    // clear current diagnostics
    audit.diagnostics.dispose();

    // update range for all issues (since the fix has potentially changed line numbering in the file)
    const updatedIssues: Issue[] = [];
    for (const issue of audit.issues[uri]) {
      if (fixedIssueIdAndPointers.has(getIssueUniqueId(issue))) {
        continue;
      }
      issue.range = range(document, root2, issue.pointer);
      updatedIssues.push(issue);
    }
    audit.issues[uri] = updatedIssues;

    // update issuesByType map alltogether
    for (const fixedIssueId of fixedIssueIds) {
      const updatedIssues: Issue[] = [];
      // consider issuesByType may return issues belong to different uris
      for (const issue of audit.issuesByType[fixedIssueId]) {
        if (issue.documentUri === uri && fixedIssueIdAndPointers.has(getIssueUniqueId(issue))) {
          continue;
        }
        // Range has been already updated above
        updatedIssues.push(issue);
      }
      audit.issuesByType[fixedIssueId] = updatedIssues;
    }
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

export function registerQuickfixes(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext
) {
  vscode.commands.registerTextEditorCommand(
    "openapi.simpleQuickFix",
    async (editor, edit, issues, fix) => quickFixCommand(editor, issues, fix, auditContext, cache)
  );

  vscode.languages.registerCodeActionsProvider("yaml", new AuditCodeActions(auditContext), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });

  vscode.languages.registerCodeActionsProvider("json", new AuditCodeActions(auditContext), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });

  for (const fix of quickfixes.fixes) {
    for (const problemId of fix.problem) {
      registeredQuickFixes[problemId] = fix;
    }
  }
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
    const uri = document.uri.toString();
    const issues = getIssuesByURI(this.auditContext, uri);
    if (issues.length === 0) {
      return result;
    }

    const titles = [];
    const problems = [];
    const parameters = [];
    const assembledIssues = [];
    let fixObject = {};
    const issuesByPointer = getIssuesByPointers(issues);

    for (const diagnostic of context.diagnostics) {
      const auditDiagnostic = <AuditDiagnostic>diagnostic;
      if (!auditDiagnostic.hasOwnProperty("id") || !auditDiagnostic.hasOwnProperty("pointer")) {
        continue;
      }
      const fix = registeredQuickFixes[auditDiagnostic.id];
      if (!fix) {
        continue;
      }
      const issue = issuesByPointer[auditDiagnostic.pointer].filter(
        (issue: Issue) => issue.id === auditDiagnostic.id
      );

      // Single Fix
      const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
      action.command = {
        arguments: [issue, fix],
        command: "openapi.simpleQuickFix",
        title: fix.title,
      };
      action.diagnostics = [diagnostic];
      action.isPreferred = false;
      result.push(action);

      // Assembled Fix
      if (
        fix.type == FixType.Insert &&
        !fix.pointer &&
        Object.prototype.toString.call(fix.fix) === "[object Object]"
      ) {
        Array.prototype.push.apply(problems, fix.problem);
        updateTitle(titles, fix.title);
        for (const parameter of fix.parameters) {
          const par = <FixParameter>clone(parameter);
          par.fixIndex = assembledIssues.length;
          parameters.push(par);
        }
        fixObject = { ...fixObject, ...fix.fix };
        assembledIssues.push(issue[0]);
      }

      // Bulk Fix
      const sameIssues = issues.filter((issue: Issue) => issue.id === auditDiagnostic.id);
      if (sameIssues && sameIssues.length > 1) {
        const bulkTitle = fix.title + ` in all ${sameIssues.length} schemas`;
        const bulkAction = new vscode.CodeAction(bulkTitle, vscode.CodeActionKind.QuickFix);
        bulkAction.command = {
          arguments: [sameIssues, fix],
          command: "openapi.simpleQuickFix",
          title: bulkTitle,
        };
        bulkAction.diagnostics = [diagnostic];
        bulkAction.isPreferred = false;
        result.push(bulkAction);
      }
    }

    // Register Assembled Fix
    if (assembledIssues.length > 1) {
      const assembledFix = {
        problems: problems,
        title: titles.join(", "),
        type: FixType.Insert,
        fix: fixObject,
        parameters: parameters,
      };
      const action = new vscode.CodeAction(assembledFix.title, vscode.CodeActionKind.QuickFix);
      action.command = {
        arguments: [assembledIssues, assembledFix],
        command: "openapi.simpleQuickFix",
        title: assembledFix.title,
      };
      action.diagnostics = [];
      action.isPreferred = true;
      result.push(action);
    }

    return result;
  }
}

export function updateTitle(titles: any[], title: string): void {
  if (titles.length === 0) {
    titles.push(title);
    return;
  }
  let parts = title.split(" ");
  let prevParts = titles[titles.length - 1].split(" ");
  if (parts[0].toLocaleLowerCase() !== prevParts[0].toLocaleLowerCase()) {
    parts[0] = parts[0].toLocaleLowerCase();
    titles.push(parts.join(" "));
    return;
  }
  if (
    parts[parts.length - 1].toLocaleLowerCase() !==
    prevParts[prevParts.length - 1].toLocaleLowerCase()
  ) {
    parts.shift();
    titles[titles.length - 1] += ", " + parts.join(" ");
    return;
  }
  parts.shift();
  parts.pop();
  let lastPrevPart = prevParts.pop();
  prevParts[prevParts.length - 1] += ",";
  Array.prototype.push.apply(prevParts, parts);
  prevParts.push(lastPrevPart);
  titles[titles.length - 1] = prevParts.join(" ");
}

function getWorkspaceEdit(context: FixContext) {
  if (context.edit) {
    return context.edit;
  }
  context.edit = new vscode.WorkspaceEdit();
  return context.edit;
}

function getIssuesByURI(auditContext: AuditContext, uri: string): Issue[] {
  let issues = [];
  if (auditContext[uri]) {
    issues = auditContext[uri].issues[uri];
  } else {
    for (const audit of Object.values(auditContext)) {
      if (uri in audit.issues) {
        Array.prototype.push.apply(issues, audit.issues[uri]);
      }
    }
  }

  return issues;
}

function getIssuesByPointers(issues: Issue[]): { [key: string]: Issue[] } {
  const issuesByPointers: { [key: string]: Issue[] } = {};
  for (const issue of issues) {
    if (!issuesByPointers[issue.pointer]) {
      issuesByPointers[issue.pointer] = [];
    }
    issuesByPointers[issue.pointer].push(issue);
  }
  return issuesByPointers;
}

function getIssueUniqueId(issue: Issue): string {
  return issue.id + issue.pointer;
}
