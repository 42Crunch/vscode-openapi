/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import * as quickfixes from "./quickfixes.json";
import {
  AuditContext,
  AuditDiagnostic,
  DeleteFix,
  FixContext,
  FixParameter,
  FixSnippetParameters,
  InsertReplaceRenameFix,
  Issue,
  RegexReplaceFix,
  Fix,
  FixType,
  OpenApiVersion,
  BundleResult,
} from "../types";
import { Node } from "@xliic/openapi-ast-node";
import { updateDiagnostics } from "./diagnostic";
import { updateDecorations, setDecorations } from "./decoration";
import { ReportWebView } from "./report";
import {
  deleteJsonNode,
  deleteYamlNode,
  getFixAsJsonString,
  getFixAsYamlString,
  insertJsonNode,
  insertYamlNode,
  renameKeyNode,
  replaceJsonNode,
  replaceYamlNode,
  simpleClone,
} from "../util";
import { Cache } from "../cache";
import parameterSources from "./quickfix-sources";
import { getLocationByPointer } from "./util";

const registeredQuickFixes: { [key: string]: Fix } = {};

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

  const audit = auditContext.auditsByDocument[uri];
  if (!audit) {
    return;
  }

  const version = cache.getDocumentVersionByDocumentUri(audit.summary.documentUri);
  const bundle = await cache.getDocumentBundleByDocumentUri(audit.summary.documentUri);

  const issuesByPointer = getIssuesByPointers(issues);
  // Single fix has one issue in the array
  // Assembled fix means all issues share same pointer, but have different ids
  // Bulk means all issues share same id, but have different pointers
  const bulk = Object.keys(issuesByPointer).length > 1;

  for (const issuePointer of Object.keys(issuesByPointer)) {
    // if fix.pointer exists, append it to diagnostic.pointer
    const pointer = fix.pointer ? `${issuePointer}${fix.pointer}` : issuePointer;
    const root = await cache.getDocumentAst(document);
    const target = root.find(pointer);

    const context: FixContext = {
      editor: editor,
      edit: edit,
      issues: bulk ? issuesByPointer[issuePointer] : issues,
      fix: simpleClone(fix),
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
  // create temp hash set to have constant time complexity while searching for fixed issues
  const fixedIssueIds: Set<string> = new Set();
  const fixedIssueIdAndPointers: Set<string> = new Set();
  issues.forEach((issue: Issue) => {
    fixedIssueIds.add(issue.id);
    fixedIssueIdAndPointers.add(issue.id + issue.pointer);
  });

  // update range for all issues (since the fix has potentially changed line numbering in the file)
  const root = await cache.getDocumentAst(document);
  const updatedIssues: Issue[] = [];
  for (const issue of audit.issues[uri]) {
    if (fixedIssueIdAndPointers.has(getIssueUniqueId(issue))) {
      continue;
    }
    const [lineNo, range] = getLocationByPointer(document, root, issue.pointer);
    issue.lineNo = lineNo;
    issue.range = range;
    updatedIssues.push(issue);
  }
  audit.issues[uri] = updatedIssues;

  // rebuild diagnostics and decorations and refresh report
  updateDiagnostics(auditContext.diagnostics, audit.filename, audit.issues, editor);
  updateDecorations(auditContext.decorations, audit.summary.documentUri, audit.issues);
  setDecorations(editor, auditContext);
  ReportWebView.showIfVisible(audit);
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

  vscode.languages.registerCodeActionsProvider("yaml", new AuditCodeActions(auditContext, cache), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });

  vscode.languages.registerCodeActionsProvider("json", new AuditCodeActions(auditContext, cache), {
    providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
  });

  for (const fix of quickfixes.fixes) {
    for (const problemId of fix.problem) {
      registeredQuickFixes[problemId] = <Fix>fix;
    }
  }
}

function createSingleAction(
  diagnostic: AuditDiagnostic,
  issues: Issue[],
  fix: Fix
): vscode.CodeAction[] {
  const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
  action.command = {
    arguments: [issues, fix],
    command: "openapi.simpleQuickFix",
    title: fix.title,
  };
  action.diagnostics = [diagnostic];
  action.isPreferred = true;
  return [action];
}

function createCombinedAction(
  issues: Issue[],
  titles: string[],
  problem: string[],
  parameters: FixParameter[],
  fixfix: object
): vscode.CodeAction[] {
  if (issues.length > 1) {
    const combinedFix: InsertReplaceRenameFix = {
      problem,
      title: titles.join(", ").replace("property", "properties").replace("response", "responses"),
      type: FixType.Insert,
      fix: fixfix,
      parameters: parameters,
    };

    const action = new vscode.CodeAction(combinedFix.title, vscode.CodeActionKind.QuickFix);
    action.command = {
      arguments: [issues, combinedFix],
      command: "openapi.simpleQuickFix",
      title: combinedFix.title,
    };
    action.diagnostics = [];
    action.isPreferred = true;

    return [action];
  }
  return [];
}

function createBulkAction(
  version: OpenApiVersion,
  bundle: BundleResult,
  diagnostic: AuditDiagnostic,
  issue: Issue,
  issues: Issue[],
  fix: Fix
): vscode.CodeAction[] {
  // FIXME for offering the bulk action, make sure that current issue also has
  // parameter values from source

  // continue only if the current issue has non-default params
  if (!hasNonDefaultParams(issue, fix, version, bundle)) {
    return [];
  }

  // all issues with same id and non-default params
  const similarIssues = issues
    .filter((issue: Issue) => issue.id === diagnostic.id)
    .filter((issue) => hasNonDefaultParams(issue, fix, version, bundle));

  if (similarIssues.length > 1) {
    const bulkTitle = `Group fix: ${fix.title} in ${similarIssues.length} locations`;
    const bulkAction = new vscode.CodeAction(bulkTitle, vscode.CodeActionKind.QuickFix);
    bulkAction.command = {
      arguments: [similarIssues, fix],
      command: "openapi.simpleQuickFix",
      title: bulkTitle,
    };
    bulkAction.diagnostics = [diagnostic];
    bulkAction.isPreferred = false;
    return [bulkAction];
  }

  return [];
}

function hasNonDefaultParams(
  issue: Issue,
  fix: Fix,
  version: OpenApiVersion,
  bundle: BundleResult
) {
  if (!fix.parameters) {
    return true;
  }

  const nonDefaultParameterValues = fix.parameters
    .map((parameter) => getSourceValue(issue, fix, parameter, version, bundle))
    .filter((values) => values.length > 0);

  return fix.parameters.length === nonDefaultParameterValues.length;
}

export class AuditCodeActions implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
  constructor(private auditContext: AuditContext, private cache: Cache) {}

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    const uri = document.uri.toString();
    const audit = this.auditContext.auditsByDocument[uri];
    const issues = audit?.issues[uri];

    if (!issues || issues.length === 0) {
      return [];
    }

    const version = this.cache.getDocumentVersionByDocumentUri(audit.summary.documentUri);
    const bundle = await this.cache.getDocumentBundleByDocumentUri(audit.summary.documentUri);

    const titles: string[] = [];
    const problems: string[] = [];
    const parameters = [];
    const combinedIssues: Issue[] = [];
    let fixObject = {};
    const issuesByPointer = getIssuesByPointers(issues);

    // Only AuditDiagnostic with fixes in registeredQuickFixes
    const diagnostics: AuditDiagnostic[] = <AuditDiagnostic[]>context.diagnostics.filter(
      (diagnostic) => {
        return diagnostic["id"] && diagnostic["pointer"] && registeredQuickFixes[diagnostic["id"]];
      }
    );

    for (const diagnostic of diagnostics) {
      const fix = registeredQuickFixes[diagnostic.id];
      const issue = issuesByPointer[diagnostic.pointer].filter(
        (issue: Issue) => issue.id === diagnostic.id
      );

      actions.push(...createSingleAction(diagnostic, issue, fix));
      actions.push(...createBulkAction(version, bundle, diagnostic, issue[0], issues, fix));

      // Combined Fix
      if (fix.type == FixType.Insert && !fix.pointer && !Array.isArray(fix.fix)) {
        problems.push(...fix.problem);
        updateTitle(titles, fix.title);
        if (fix.parameters) {
          for (const parameter of fix.parameters) {
            const par = <FixParameter>simpleClone(parameter);
            par.fixIndex = combinedIssues.length;
            parameters.push(par);
          }
        }
        fixObject = { ...fixObject, ...fix.fix };
        combinedIssues.push(issue[0]);
      }
    }

    actions.push(...createCombinedAction(combinedIssues, titles, problems, parameters, fixObject));

    return actions;
  }
}

function getSourceValue(
  issue: Issue,
  fix: Fix,
  parameter: FixParameter,
  version: OpenApiVersion,
  bundle: BundleResult
): any[] {
  if (parameter.source && parameterSources[parameter.source]) {
    const source = parameterSources[parameter.source];
    const value = source(issue, fix, parameter, version, bundle);
    return value;
  }
  return [];
}

export function updateTitle(titles: string[], title: string): void {
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
  const plurals = {
    property: "properties",
    response: "responses"
  };
  if (
    !compareAsWord(parts[parts.length - 1], prevParts[prevParts.length - 1], plurals)
  ) {
    parts.shift();
    titles[titles.length - 1] += ", " + parts.join(" ");
    return;
  }
  parts.shift();
  parts.pop();
  let lastPrevPart = prevParts.pop();
  prevParts[prevParts.length - 1] += ",";
  prevParts.push(...parts);
  if (lastPrevPart in plurals) {
    lastPrevPart = plurals[lastPrevPart];
  }
  prevParts.push(lastPrevPart);
  titles[titles.length - 1] = prevParts.join(" ");
}

function compareAsWord(a: string, b: string, plural: { [key: string]: string }): boolean {
  a = a.toLocaleLowerCase();
  b = b.toLocaleLowerCase();
  return a === b || plural[a] === b || plural[b] === a;
}

function getWorkspaceEdit(context: FixContext) {
  if (context.edit) {
    return context.edit;
  }
  context.edit = new vscode.WorkspaceEdit();
  return context.edit;
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
