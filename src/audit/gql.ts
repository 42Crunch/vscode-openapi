/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { parse, visit } from "graphql";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { HttpMethod } from "@xliic/openapi";
import { extensionQualifiedId, PendingAudits } from "../types";
import { Cache } from "../cache";
import { Configuration, configuration } from "../configuration";
import { ensureHasCredentials } from "../credentials";
import { CliError, ensureCliDownloaded } from "../platform/cli-ast";
import { PlatformStore } from "../platform/stores/platform-store";
import { AuditWebView } from "./view";
import { loadConfig } from "../util/config";
import { SignUpWebView } from "../webapps/signup/view";
import { Config } from "@xliic/common/config";
import { createTempDirectory } from "../util/fs";
import { writeFile, readFile, copyFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Result } from "@xliic/result";
import { fromInternalUri } from "../external-refs";
import path, { basename } from "path";
import { Audit, Issue, Grades, ReportedIssue } from "@xliic/common/audit";
import { AuditContext, IssuesByDocument, MappingNode } from "../types";
import { Parsed, find } from "@xliic/preserving-json-yaml-parser";
import { setDecorations } from "./decoration";
import { setAudit } from "./service";

const asyncExecFile = promisify(execFile);
const execMaxBuffer = 1024 * 1024 * 20; // 20MB

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
      async (progress, cancellationToken): Promise<{ audit: Audit } | undefined> => {
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
        //}
      }
    );

    if (result) {
      setAudit(auditContext, uri, result.audit, "result.tempAuditDirectory");
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
): Promise<{ audit: Audit } | undefined> {
  const config = await loadConfig(configuration, secrets);

  const result = await runAuditWithCliBinary(secrets, config, text, config.cliDirectoryOverride);

  const audit = await parseGqlAuditReport(cache, document, result?.audit, result?.graphQlAst);

  return { audit };
}

async function runAuditWithCliBinary(
  secrets: vscode.SecretStorage,
  config: Config,
  text: string,
  cliDirectoryOverride: string
): Promise<{
  audit: unknown;
  graphQlAst: unknown;
}> {
  const dir = createTempDirectory("audit-");
  await writeFile(join(dir as string, "openapi.graphql"), text, { encoding: "utf8" });

  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  const env: Record<string, string> = {};

  const args = ["graphql", "audit", "openapi.graphql", "--output", "report.json"];

  // if (config.platformAuthType === "anond-token") {
  //   const anondToken = getAnondCredentials(configuration);
  //   args.push("--token", String(anondToken));
  // } else {
  //   const platformConnection = await getPlatformCredentials(configuration, secrets);
  //   if (platformConnection !== undefined) {
  //     env["API_KEY"] = platformConnection.apiToken!;
  //     env["PLATFORM_HOST"] = platformConnection.platformUrl;
  //   }
  // }

  // const httpProxy = vscode.workspace.getConfiguration().get<string>("http.proxy");
  // if (httpProxy !== undefined && httpProxy !== "") {
  //   env["HTTPS_PROXY"] = httpProxy;
  // }

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

    return { audit: parsed, graphQlAst: ast };
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
      // TODO: implement here!!!
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
  ast: any,
  pointer: string
): [number, vscode.Range] | undefined {
  // "location": "Mutation.createTweet().Tweet.Author.User.avatar_url: ID",
  // "location": "Query.Tweets()[0].Tweet.Author.User.avatar_url: ID",
  // "location": "Mutation.deleteTweet().Tweet.Stats.Stat.views: Int",
  // "location": "Query.Tweet().Tweet.Author.User.full_name: String",
  // "location": "Query.Tweet(id: ID!)",
  // "location": "Query.Tweets(): [Tweet]",
  // "location": "Query.Notifications(): [Notification]",
  // Query.viewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)
  // Mutation.mutationViewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)
  // Mutation.migrationsSetLfsPreference().Import.projectChoices[0].ProjectChoicesListItem.tfvcProject: String
  // Query.reposHooks()[0].Hook.lastResponse.HookResponse.code: Int!
  // Query.searchCode().SearchCode.items[0].CodeSearchResultItem.textMatches[0].SearchResultTextMatchesListItem.matches: [MatchesListItem]
  // Query.searchCommits().SearchCommits.items[0].CommitSearchResultItem.parents: [ParentsListItem]!
  // Query.appInstallations()[0].Installation.account.Account.avatarUrl: _
  // Query.gists()[0].BaseGist.history[0]: _
  // Mutation.pullsCreateReview(reposPullsReviewsInput.ReposPullsReviewsInput.comments: [CommentsListItemInput])
  // Mutation.reposUpdateBranchProtection(reposBranchProtectionInput.ReposBranchProtectionInput.requiredStatusChecks.RequiredStatusChecks2Input.contexts: [String]!)
  // Mutation.issuesUpdate(reposIssuesInput.ReposIssuesInput.labels[0]: _)
  // Mutation.scimUpdateAttributeForUser(scimV2OrganizationsUser2Input.ScimV2OrganizationsUser2Input.operations[0].OperationsListItemInput.value: _)

  const p1 = new RegExp(":\\s*\\[.*\\]$");
  const p2 = new RegExp("\\(.*:.*\\)$");

  //console.info(pointer);
  // if (
  //   pointer.startsWith(
  //     "Mutation.pullsCreateReview(reposPullsReviewsInput.ReposPullsReviewsInput.comments: [CommentsListItemInput])"
  //   )
  // ) {
  //   console.info("");
  // }
  const path: string[] = [];
  let items;
  // Be carefull with dots inside () like Query.viewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)
  if (pointer.match(p2)) {
    const mainPtr = pointer.substring(0, pointer.lastIndexOf("("));
    const prefix = pointer.substring(pointer.lastIndexOf("("));
    items = mainPtr.split(".");
    items[items.length - 1] = items[items.length - 1] + prefix;
  } else {
    items = pointer.split(".");
  }

  const cleanValue = function (value: string, valueToRemove: string): string {
    const i = value.indexOf(valueToRemove);
    return 0 < i ? value.substring(0, i) : value;
  };

  items.forEach((item) => {
    item = cleanValue(item, "(");
    item = cleanValue(item, "[");
    item = cleanValue(item, ":");
    path.push(item);
    // const i = item.indexOf("(");
    // if (0 < i) {
    //   //const j = Math.max(item.lastIndexOf(")"), item.lastIndexOf("]"));
    //   path.push(item.substring(0, i));
    // } else {
    //   const k = item.indexOf(":");
    //   if (0 < k) {
    //     path.push(item.substring(0, k));
    //   } else {
    //     path.push(item);
    //   }
    // }
  });

  let objTypeDef = null;
  let fieldDef = null;
  for (const item of path) {
    if (objTypeDef && fieldDef) {
      objTypeDef = null;
      fieldDef = null;
    }
    if (objTypeDef === null) {
      for (const def of ast.definitions) {
        if (def.name.value === item) {
          objTypeDef = def;
          fieldDef = null;
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
  let myLoc = undefined;
  if (fieldDef) {
    myLoc = fieldDef.name.loc;
    // Try to find more precise location
    const lastItem = items[items.length - 1];
    if (!lastItem.includes("(") && lastItem.includes(":")) {
      myLoc = fieldDef.type.loc;
    } else if (lastItem.match(p1)) {
      myLoc = fieldDef.type.type.loc;
    } else if (lastItem.match(p2)) {
      const listTarget = lastItem
        .substring(lastItem.indexOf("(") + 1, lastItem.lastIndexOf(":"))
        .trim();
      for (const arg of fieldDef.arguments) {
        // listTarget may be like accessToken.AccessTokenInput.apiKey or just accessToken
        if (listTarget === arg.name.value || listTarget.startsWith(arg.name.value + ".")) {
          myLoc = arg.type.loc;
          break;
        }
      }
    }
  } else if (objTypeDef) {
    myLoc = objTypeDef.name.loc;
  }

  // "loc": {
  //   "start": 272,
  //   "end": 274
  // }

  if (myLoc) {
    const start = myLoc.start;
    const end = myLoc.end;
    const pos1 = document.positionAt(start);
    //const line1 = document.lineAt(pos1.line);
    const pos2 = document.positionAt(end);
    //const line2 = document.lineAt(pos2.line);

    const range = new vscode.Range(pos1, pos2);
    return [pos1.line, range];
  } else {
    console.info(`Unable to locate node: ${pointer}`);
    return undefined;
  }
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

  function transformIssues(issues: any, defaultCriticality: number = 5): ReportedIssue[] {
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

  // const node = find(root, pointer);
  // if (node !== undefined) {
  //   return [mainUri.toString(), pointer];
  // } else {
  //   const mapping = findMapping(mappings, pointer);
  //   if (mapping && mapping.hash) {
  //     return [mapping.uri, mapping.hash];
  //   }
  // }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

function getUserAgent() {
  const extension = vscode.extensions.getExtension(extensionQualifiedId)!;
  return `42Crunch-VSCode/${extension.packageJSON.version}`;
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
