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
import {
  chmodSync,
  createWriteStream,
  mkdirSync,
  mkdtempSync,
  rmdirSync,
  unlinkSync,
} from "node:fs";
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
  editor: vscode.TextEditor,
  path?: string,
  method?: HttpMethod
) {
  if (!(await ensureHasCredentials(signUpWebView, configuration, secrets))) {
    return;
  }

  // if (!(await offerDataDictionaryUpdateAndContinue(editor.document.uri))) {
  //   return;
  // }

  const uri = editor.document.uri.toString();

  if (pendingAudits[uri]) {
    vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
    return;
  }

  delete auditContext.auditsByMainDocument[uri];
  pendingAudits[uri] = true;

  try {
    //reportWebView.prefetchKdb();
    await reportWebView.sendStartAudit();
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running GQL Security Audit...",
        cancellable: false,
      },
      async (progress, cancellationToken): Promise<{ audit: Audit } | undefined> => {
        const isFullAudit = path === undefined || method === undefined;
        const text = editor.document.getText();
        //const { value, mapping } = await bundleOrThrow(cache, editor.document);
        // const oas = isFullAudit
        //   ? stringify(value)
        //   : stringify(extractSingleOperation(method, path as string, value));
        // if ((await chooseAuditRuntime(configuration, secrets)) === "platform") {
        //   return runPlatformAudit(editor.document, oas, mapping, cache, store, memento);
        // } else {
        // use CLI
        if (await ensureCliDownloaded(configuration, secrets)) {
          // const tags = store.isConnected()
          //   ? await store.getTagsForDocument(editor.document, memento)
          //   : [];
          return runCliAudit(
            editor.document,
            text,
            cache,
            secrets,
            configuration,
            progress,
            isFullAudit
          );
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

// async function bundleOrThrow(cache: Cache, document: vscode.TextDocument): Promise<Bundle> {
//   const bundle = await cache.getDocumentBundle(document, { rebundle: true });

//   if (!bundle || "errors" in bundle) {
//     vscode.commands.executeCommand("workbench.action.problems.focus");
//     throw new Error("Failed to bundle for audit, check OpenAPI file for errors.");
//   }

//   return bundle;
// }

// async function offerDataDictionaryUpdateAndContinue(documentUri: vscode.Uri): Promise<boolean> {
//   const proceed = await vscode.commands.executeCommand(
//     "openapi.platform.dataDictionaryPreAuditBulkUpdateProperties",
//     documentUri
//   );

//   return proceed === true;
// }

// async function chooseAuditRuntime(
//   configuration: Configuration,
//   secrets: vscode.SecretStorage
// ): Promise<"platform" | "cli"> {
//   const config = await loadConfig(configuration, secrets);
//   // paid users are allowed to choose the runtime, freemium users always use the cli
//   if (config.platformAuthType === "api-token") {
//     return config.auditRuntime;
//   } else {
//     return "cli";
//   }
// }

async function runCliAudit(
  document: vscode.TextDocument,
  text: string,
  cache: Cache,
  secrets: vscode.SecretStorage,
  configuration: Configuration,
  progress: vscode.Progress<any>,
  isFullAudit: boolean
): Promise<{ audit: Audit } | undefined> {
  // const logger: Logger = {
  //   fatal: (message: string) => null,
  //   error: (message: string) => null,
  //   warning: (message: string) => null,
  //   info: (message: string) => null,
  //   debug: (message: string) => null,
  // };

  const config = await loadConfig(configuration, secrets);

  const [result, error] = await runAuditWithCliBinary(
    secrets,
    config,
    text,
    isFullAudit,
    config.cliDirectoryOverride
  );

  // if (error !== undefined) {
  //   if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
  //     await offerUpgrade(isFullAudit);
  //     return;
  //   } else {
  //     throw new Error(`Unexpected error running Security Audit: ${JSON.stringify(error)}`);
  //   }
  // }

  // if (
  //   result.cli.remainingPerOperationAudit !== undefined &&
  //   result.cli.remainingPerOperationAudit < UPGRADE_WARN_LIMIT
  // ) {
  //   warnOperationAudits(result.cli.remainingPerOperationAudit);
  // }

  const audit = await parseGqlAuditReport(cache, document, result?.audit, result?.graphQlAst);

  // if (result.todo !== undefined) {
  //   const { issues: todo } = await parseAuditReport(cache, document, result.todo, mapping);
  //   audit.todo = todo;
  // }

  // if (result.compliance !== undefined) {
  //   audit.compliance = result.compliance as any;
  // }

  return { audit };
}

async function runAuditWithCliBinary(
  secrets: vscode.SecretStorage,
  config: Config,
  text: string,
  isFullAudit: boolean,
  cliDirectoryOverride: string
): Promise<
  Result<
    {
      audit: unknown;
      graphQlAst: unknown;
    },
    CliError
  >
> {
  //42c-ast-windows-amd64 graphql audit example.graphql --output myGQL-ast-audit.json

  const dir = createTempDirectory("audit-");
  await writeFile(join(dir as string, "openapi.graphql"), text, { encoding: "utf8" });

  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());
  //const userAgent = getUserAgent();

  const env: Record<string, string> = {};

  const args = ["graphql", "audit", "openapi.graphql", "--output", "report.json"];

  // if (!isFullAudit) {
  //   args.push("--is-operation");
  // }

  // if (tags.length > 0) {
  //   args.push("--tag", tags.join(","));
  // }

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

    /////////////////////////
    /////////////////////////
    const ast = parse(text);

    // const newAst = visit(ast, {
    //   enter(node, key, parent, path, ancestors) {
    //     console.info("key=" + key + ", path=" + path);
    //   },
    //   leave(node, key, parent, path, ancestors) {
    //     console.info("key=" + key + ", path=" + path);
    //   },
    // });
    /////////////////////////
    /////////////////////////

    //const cliResponse = JSON.parse(output.stdout);
    return [{ audit: parsed, graphQlAst: ast }, undefined];
  } catch (ex: any) {
    const error = readException(ex);
    throw new Error(formatException(error));
    // if (ex.code === 3) {
    //   // limit reached
    //   const cliError = JSON.parse(ex.stdout);
    //   return [undefined, cliError];
    // } else {
    //   const error = readException(ex);
    //   const json = parseCliJsonResponse(error.stdout);
    //   if (json !== undefined) {
    //     return [undefined, json];
    //   } else {
    //     throw new Error(formatException(error));
    //   }
    // }
  }
}

async function parseGqlAuditReport(
  cache: Cache,
  document: vscode.TextDocument,
  report: any,
  ast: any
): Promise<Audit> {
  const documentUri: string = document.uri.toString();

  const [grades, issues, documents, badIssues] = await splitReportByDocument(
    document,
    report,
    ast,
    cache
  );

  // if (badIssues.length > 0) {
  //   const messages = badIssues.map(
  //     (issue: ReportedIssue) => `Unable to locate issue "${issue.id}" at "${issue.pointer}".`
  //   );
  //   messages.unshift(
  //     "Some issues have not been displayed, please contact support at https://support.42crunch.com with the following information:"
  //   );
  //   vscode.window.showErrorMessage(messages.join(" "));
  // }

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

  const [mainRoot, documentUris, issuesPerDocument, badIssues] = await processIssues(
    mainDocument,
    cache,
    reportedIssues
  );

  const files: { [uri: string]: [vscode.TextDocument, Parsed | undefined] } = {
    [mainDocument.uri.toString()]: [mainDocument, mainRoot],
  };

  // load and parse all documents
  for (const uri of documentUris) {
    if (!files[uri]) {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
      const root = undefined; //cache.getLastGoodParsedDocument(document);
      files[uri] = [document, root];
    }
  }

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
  const path: string[] = [];
  pointer.split(".").forEach((item) => {
    const i = item.indexOf("(");
    if (0 < i) {
      //const j = Math.max(item.lastIndexOf(")"), item.lastIndexOf("]"));
      path.push(item.substring(0, i));
    } else {
      const k = item.indexOf(":");
      if (0 < k) {
        path.push(item.substring(0, k));
      } else {
        path.push(item);
      }
    }
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
  //const jsonPointerIndex = assessment.index;

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
      value: Math.round(assessment.score ? assessment.score : 0),
      max: 70,
    },
    security: {
      value: Math.round(assessment.score ? assessment.score : 0),
      max: 30,
    },
    oasconformance: {
      value: 0,
      max: 0,
    },
    all: 0,
    errors: false,
    invalid: false,
  };

  if (assessment.semanticErrors || assessment.validationErrors) {
    grades.errors = true;
  }

  if (assessment.openapiState === "fileInvalid") {
    grades.invalid = true;
  }

  grades.all = Math.round(assessment.score ? assessment.score : 0);

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
