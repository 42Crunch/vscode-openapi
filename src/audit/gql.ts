/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Audit, Grades, ReportedIssue } from "@xliic/common/audit";
import { Config } from "@xliic/common/config";
import { Parsed } from "@xliic/preserving-json-yaml-parser";
import { parse } from "graphql";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import path, { basename } from "path";
import * as vscode from "vscode";
import { Cache } from "../cache";
import { Configuration, configuration } from "../configuration";
import { ensureHasCredentials } from "../credentials";
import { fromInternalUri } from "../external-refs";
import { ensureCliDownloaded } from "../platform/cli-ast";
import { PlatformStore } from "../platform/stores/platform-store";
import { AuditContext, IssuesByDocument, PendingAudits } from "../types";
import { loadConfig } from "../util/config";
import { createTempDirectory } from "../util/fs";
import { SignUpWebView } from "../webapps/signup/view";
import { setDecorations } from "./decoration";
import { setAudit } from "./service";
import { AuditWebView } from "./view";

const asyncExecFile = promisify(execFile);
const execMaxBuffer = 1024 * 1024 * 20; // 20MB

const ARGUMENT_PATTERN = new RegExp("\\(.*:.*\\)$");
const LIST_TYPE_PATTERN = new RegExp(":\\s*\\[.*]!?$");
const SIMPLE_TYPE_PATTERN = new RegExp(":\\s*[^()\\[\\]]+$");

export function registerSecurityGqlAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  signUpWebView: SignUpWebView
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityGqlAudit",
    async (textEditor: vscode.TextEditor, edit) => {
      await securityAudit(
        signUpWebView,
        context.workspaceState,
        context.secrets,
        cache,
        auditContext,
        pendingAudits,
        reportWebView,
        store,
        textEditor
      );
    }
  );
}

async function securityAudit(
  signUpWebView: SignUpWebView,
  memento: vscode.Memento,
  secrets: vscode.SecretStorage,
  cache: Cache,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  editor: vscode.TextEditor
) {
  if (!(await ensureHasCredentials(signUpWebView, configuration, secrets))) {
    return;
  }

  const uri = editor.document.uri.toString();

  if (pendingAudits[uri]) {
    vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
    return;
  }

  delete auditContext.auditsByMainDocument[uri];
  pendingAudits[uri] = true;

  try {
    await reportWebView.sendStartAudit();
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running GQL Security Audit...",
        cancellable: false,
      },
      async (
        progress,
        cancellationToken
      ): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> => {
        const text = editor.document.getText();
        if (await ensureCliDownloaded(configuration, secrets)) {
          return runCliAudit(editor.document, text, cache, secrets, configuration, progress);
        } else {
          // cli is not available and user chose to cancel download
          vscode.window.showErrorMessage(
            "42Crunch API Security Testing Binary is required to run Audit."
          );
          return;
        }
      }
    );

    if (result) {
      setAudit(auditContext, uri, result.audit, result.tempAuditDirectory);
      setDecorations(editor, auditContext);
      await reportWebView.showReport(result.audit);
    } else {
      await reportWebView.sendCancelAudit();
    }
    delete pendingAudits[uri];
  } catch (e) {
    delete pendingAudits[uri];
    vscode.window.showErrorMessage(`Failed to audit: ${e}`);
  }
}

async function runCliAudit(
  document: vscode.TextDocument,
  text: string,
  cache: Cache,
  secrets: vscode.SecretStorage,
  configuration: Configuration,
  progress: vscode.Progress<any>
): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> {
  const config = await loadConfig(configuration, secrets);

  const result = await runAuditWithCliBinary(secrets, config, text, config.cliDirectoryOverride);

  const audit = await parseGqlAuditReport(cache, document, result?.audit, result?.graphQlAst);

  return { audit, tempAuditDirectory: result.tempAuditDirectory };
}

async function runAuditWithCliBinary(
  secrets: vscode.SecretStorage,
  config: Config,
  text: string,
  cliDirectoryOverride: string
): Promise<{
  audit: unknown;
  graphQlAst: unknown;
  tempAuditDirectory: string;
}> {
  const dir = createTempDirectory("audit-");
  await writeFile(join(dir, "schema.graphql"), text, { encoding: "utf8" });

  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  const env: Record<string, string> = {};

  const args = ["graphql", "audit", "schema.graphql", "--output", "report.json"];

  try {
    const output = await asyncExecFile(cli, args, {
      cwd: dir as string,
      windowsHide: true,
      env,
      maxBuffer: execMaxBuffer,
    });

    const reportFilename = join(dir, "report.json");
    const report = await readFile(reportFilename, { encoding: "utf8" });
    const parsed = JSON.parse(report);

    const ast = parse(text);

    return { audit: parsed, graphQlAst: ast, tempAuditDirectory: dir };
  } catch (ex: any) {
    const error = readException(ex);
    throw new Error(formatException(error));
  }
}

async function parseGqlAuditReport(
  cache: Cache,
  document: vscode.TextDocument,
  report: any,
  ast: any
): Promise<Audit> {
  const documentUri: string = document.uri.toString();

  const [grades, issues, documents, _badIssues] = await splitReportByDocument(
    document,
    report,
    ast,
    cache
  );

  const filename = basename(document.fileName);

  const files: Audit["files"] = {};
  const mainPath = document.uri.fsPath;
  const mainDir = path.dirname(mainPath);
  for (const uri of Object.keys(documents)) {
    const publicUri = fromInternalUri(vscode.Uri.parse(uri));
    if (publicUri.scheme === "http" || publicUri.scheme === "https") {
      files[uri] = { relative: publicUri.toString() };
    } else {
      files[uri] = { relative: path.relative(mainDir, publicUri.fsPath) };
    }
  }

  const result = {
    valid: report.valid,
    openapiState: report.openapiState,
    minimalReport: report.minimalReport,
    summary: {
      ...grades,
      documentUri,
      subdocumentUris: Object.keys(documents).filter((uri) => uri != documentUri),
    },
    issues,
    filename,
    files,
  };

  return result;
}

async function splitReportByDocument(
  mainDocument: vscode.TextDocument,
  report: any,
  ast: any,
  cache: Cache
): Promise<[Grades, IssuesByDocument, { [uri: string]: vscode.TextDocument }, ReportedIssue[]]> {
  const grades = readSummary(report);
  const reportedIssues = readAssessment(report);

  const [mainRoot, documentUris, issuesPerDocument, badIssues] = processIssues(
    mainDocument,
    cache,
    reportedIssues
  );

  const files: { [uri: string]: [vscode.TextDocument, Parsed | undefined] } = {
    [mainDocument.uri.toString()]: [mainDocument, mainRoot],
  };

  const issues: IssuesByDocument = {};
  for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
    const [document, root] = files[uri];
    issues[uri] = [];
    reportedIssues.forEach((issue: ReportedIssue) => {
      const loc = getLocationByPointer(document, ast, issue.pointer);
      if (loc) {
        const [lineNo, range] = loc;
        issues[uri].push({
          ...issue,
          documentUri: uri,
          lineNo,
          range,
        });
      }
    });
  }

  const documents: { [key: string]: vscode.TextDocument } = {};
  for (const [uri, [document, root]] of Object.entries(files)) {
    documents[uri] = document;
  }

  return [grades, issues, documents, badIssues];
}

function getLocationByPointer(
  document: vscode.TextDocument,
  reg: any,
  pointer: string
): [number, vscode.Range] | undefined {
  let items;

  // Wisely split location into parts by .
  if (pointer.match(ARGUMENT_PATTERN)) {
    const mainPtr = pointer.substring(0, pointer.lastIndexOf("("));
    const prefix = pointer.substring(pointer.lastIndexOf("("));
    items = mainPtr.split(".");
    items[items.length - 1] = items[items.length - 1] + prefix;
  } else {
    items = pointer.split(".");
  }

  // Find final field
  let objTypeDef = null;
  let fieldDef = null;
  for (let item of items) {
    item = cleanValue(item);
    if (objTypeDef !== null && fieldDef !== null) {
      objTypeDef = null;
      fieldDef = null;
    }
    if (objTypeDef === null) {
      for (const def of reg.definitions) {
        // Not all definitions have name property
        if (def.name?.value === item) {
          objTypeDef = def;
          break;
        }
      }
    } else {
      if (fieldDef === null) {
        for (const field of objTypeDef.fields) {
          if (field.name.value === item) {
            fieldDef = field;
            break;
          }
        }
      }
    }
  }

  let loc = undefined;
  if (fieldDef !== null) {
    // Try to find more precise location
    const lastItem = items[items.length - 1];
    if (lastItem.match(SIMPLE_TYPE_PATTERN) || lastItem.match(LIST_TYPE_PATTERN)) {
      // id: ID or Mutation.usersAddEmailForAuthenticated()[0]: _
      // Notifications(): [Notification] or Query.starship().Starship.coordinates: [[Float!]!]
      loc = getTypeName(fieldDef.type).loc;
    } else if (lastItem.match(ARGUMENT_PATTERN)) {
      // Notifications(limit: Int) or Query.migration(exclude[0]: String)
      let name = lastItem.substring(lastItem.indexOf("(") + 1, lastItem.lastIndexOf(":")).trim();
      name = cleanValue2(name, "[");
      let myValDef = null;
      for (const valDef of fieldDef.arguments) {
        if (name === valDef.name?.value || name.startsWith(valDef.name.value + ".")) {
          myValDef = valDef;
          break;
        }
      }
      if (myValDef != null) {
        const typeName = getTypeName(myValDef.type);
        loc = typeName.loc;
      } else {
        loc = fieldDef.type.loc;
      }
    } else {
      loc = fieldDef.loc;
    }
  } else if (objTypeDef !== null) {
    loc = objTypeDef.loc;
  }

  if (loc) {
    const pos1 = document.positionAt(loc.start);
    const pos2 = document.positionAt(loc.end);
    const range = new vscode.Range(pos1, pos2);
    return [pos1.line, range];
  } else {
    console.info(`Unable to locate node: ${pointer}`);
    return undefined;
  }
}

function getTypeName(type: any) {
  if (type.kind === "NonNullType" || type.kind === "ListType") {
    return getTypeName(type.type);
  } else {
    return type;
  }
}

function cleanValue(value: string): string {
  value = cleanValue2(value, "(");
  value = cleanValue2(value, "[");
  return cleanValue2(value, ":");
}

function cleanValue2(value: string, valueToRemove: string): string {
  const i = value.indexOf(valueToRemove);
  return 0 < i ? value.substring(0, i) : value;
}

function processIssues(
  document: vscode.TextDocument,
  cache: Cache,
  issues: ReportedIssue[]
): [Parsed | undefined, string[], { [uri: string]: ReportedIssue[] }, ReportedIssue[]] {
  const mainUri = document.uri;
  const documentUris: { [uri: string]: boolean } = { [mainUri.toString()]: true };
  const issuesPerDocument: { [uri: string]: ReportedIssue[] } = {};
  const badIssues: ReportedIssue[] = [];

  const root = cache.getLastGoodParsedDocument(document);

  if (root === undefined) {
    throw new Error("Failed to parse current document");
  }

  for (const issue of issues) {
    const location = findIssueLocation(mainUri, root, issue.pointer);
    if (location) {
      const [uri, pointer] = location;

      if (!issuesPerDocument[uri]) {
        issuesPerDocument[uri] = [];
      }

      if (!documentUris[uri]) {
        documentUris[uri] = true;
      }

      issuesPerDocument[uri].push({
        ...issue,
        pointer: pointer,
      });
    } else {
      // can't find issue, add to the list ot bad issues
      badIssues.push(issue);
    }
  }

  return [root, Object.keys(documentUris), issuesPerDocument, badIssues];
}

function readAssessment(assessment: any): ReportedIssue[] {
  let issues: ReportedIssue[] = [];

  function transformScore(score: number): string {
    const rounded = Math.abs(Math.round(score));
    if (score === 0) {
      return "0";
    } else if (rounded >= 1) {
      return rounded.toString();
    }
    return "less than 1";
  }

  function transformIssues(issues: any, defaultCriticality: number = 4): ReportedIssue[] {
    const result = [];
    for (const id of Object.keys(issues)) {
      const issue = issues[id];
      const description = issue.description;
      for (const occ of issue.occurrences) {
        result.push({
          id,
          description,
          pointer: occ.location,
          score: occ.score ? Math.abs(occ.score) : 0,
          displayScore: transformScore(occ.score ? occ.score : 0),
          criticality: issue.criticality ? issue.criticality : defaultCriticality,
        });
      }
    }

    return result;
  }

  if (assessment.issues) {
    issues = issues.concat(transformIssues(assessment.issues));
  }

  issues.sort((a, b) => b.score - a.score);
  return issues;
}

function readSummary(assessment: any): Grades {
  const grades = {
    datavalidation: {
      value: 0,
      max: 0,
    },
    security: {
      value: 0,
      max: 0,
    },
    oasconformance: {
      value: 0,
      max: 0,
    },
    all: Math.round(assessment.score ? assessment.score : 0),
    errors: false,
    invalid: false,
  };

  if (assessment.semanticErrors || assessment.validationErrors) {
    grades.errors = true;
  }

  if (assessment.openapiState === "fileInvalid") {
    grades.invalid = true;
  }

  return grades;
}

function findIssueLocation(
  mainUri: vscode.Uri,
  root: Parsed,
  pointer: string
): [string, string] | undefined {
  return [mainUri.toString(), pointer];
}

function getCrunchDirectory() {
  if (process.platform === "win32") {
    return join(process.env["APPDATA"] || homedir(), "42Crunch");
  } else {
    return join(homedir(), ".42crunch");
  }
}

function getBinDirectory(cliDirectoryOverride: string) {
  if (cliDirectoryOverride !== undefined && cliDirectoryOverride !== "") {
    return cliDirectoryOverride;
  } else {
    return join(getCrunchDirectory(), "bin");
  }
}

function getCliFilename() {
  if (process.platform === "win32") {
    return "42c-ast.exe";
  } else {
    return "42c-ast";
  }
}

function formatException({
  message,
  stdout,
  stderr,
}: {
  message: string;
  stdout: string;
  stderr: string;
}) {
  return [message, stdout, stderr].filter((message) => message !== "").join("\n");
}

function readException(ex: any) {
  const message = "message" in ex ? ex.message : "";
  const stdout = "stdout" in ex ? Buffer.from(ex.stdout, "utf8").toString() : "";
  const stderr = "stdout" in ex ? Buffer.from(ex.stderr, "utf8").toString() : "";
  return { message, stdout, stderr };
}
