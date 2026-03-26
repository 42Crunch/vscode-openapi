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
import { ensureHasCredentials, getAnondCredentials, getPlatformCredentials } from "../credentials";
import { debug, ensureCliDownloaded } from "../platform/cli-ast";
import { PlatformStore } from "../platform/stores/platform-store";
import { AuditContext, IssuesByDocument, PendingAudits } from "../types";
import { loadConfig } from "../util/config";
import { createTempDirectory } from "../util/fs";
import { SignUpWebView } from "../webapps/signup/view";
import { setDecorations } from "./decoration";
import { setAudit } from "./service";
import { AuditWebView } from "./view";
import { getProxyEnv } from "../proxy";
import { getEndpoints } from "@xliic/common/endpoints";
import { Logger } from "../platform/types";

const asyncExecFile = promisify(execFile);
const execMaxBuffer = 1024 * 1024 * 20; // 20MB

export function registerSecurityGqlAudit(
  context: vscode.ExtensionContext,
  cache: Cache,
  logger: Logger,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  signUpWebView: SignUpWebView,
) {
  return vscode.commands.registerTextEditorCommand(
    "openapi.securityGqlAudit",
    async (textEditor: vscode.TextEditor, edit) => {
      await securityAudit(
        signUpWebView,
        context.workspaceState,
        context.secrets,
        cache,
        logger,
        auditContext,
        pendingAudits,
        reportWebView,
        store,
        textEditor,
      );
    },
  );
}

async function securityAudit(
  signUpWebView: SignUpWebView,
  memento: vscode.Memento,
  secrets: vscode.SecretStorage,
  cache: Cache,
  logger: Logger,
  auditContext: AuditContext,
  pendingAudits: PendingAudits,
  reportWebView: AuditWebView,
  store: PlatformStore,
  editor: vscode.TextEditor,
) {
  if (!(await ensureHasCredentials(signUpWebView, configuration, secrets, "regular"))) {
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
        cancellationToken,
      ): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> => {
        const text = editor.document.getText();
        if (await ensureCliDownloaded(configuration, secrets)) {
          const tags = store.isConnected()
            ? await store.getTagsForDocument(editor.document, memento)
            : [];
          return runCliAudit(
            editor.document,
            text,
            tags,
            cache,
            logger,
            secrets,
            configuration,
            progress,
          );
        } else {
          // cli is not available and user chose to cancel download
          vscode.window.showErrorMessage(
            "42Crunch API Security Testing Binary is required to run Audit.",
          );
          return;
        }
      },
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
  tags: string[],
  cache: Cache,
  logger: Logger,
  secrets: vscode.SecretStorage,
  configuration: Configuration,
  progress: vscode.Progress<any>,
): Promise<{ audit: Audit; tempAuditDirectory: string } | undefined> {
  const config = await loadConfig(configuration, secrets);

  const result = await runAuditWithCliBinary(
    secrets,
    config,
    logger,
    text,
    tags,
    config.cliDirectoryOverride,
  );

  const audit = await parseGqlAuditReport(cache, document, result?.audit, result?.graphQlAst);

  return { audit, tempAuditDirectory: result.tempAuditDirectory };
}

async function runAuditWithCliBinary(
  secrets: vscode.SecretStorage,
  config: Config,
  logger: Logger,
  text: string,
  tags: string[],
  cliDirectoryOverride: string,
): Promise<{
  audit: unknown;
  graphQlAst: unknown;
  tempAuditDirectory: string;
}> {
  const { cliFreemiumdHost, freemiumdUrl } = getEndpoints(config.internalUseDevEndpoints);
  const dir = createTempDirectory("audit-");
  await writeFile(join(dir, "schema.graphql"), text, { encoding: "utf8" });

  const cli = join(getBinDirectory(cliDirectoryOverride), getCliFilename());

  const env: Record<string, string> = {};

  const args = [
    "graphql",
    "audit",
    "schema.graphql",
    "--freemium-host",
    cliFreemiumdHost,
    "--output",
    "report.json",
  ];

  if (tags.length > 0) {
    args.push("--tag", tags.join(","));
  }

  if (config.platformAuthType === "anond-token") {
    const anondToken = getAnondCredentials(configuration);
    args.push("--token", String(anondToken));
    Object.assign(env, await getProxyEnv(freemiumdUrl, undefined, config, logger));
  } else {
    const platformConnection = await getPlatformCredentials(configuration, secrets);
    if (platformConnection !== undefined) {
      logger.debug(
        `Setting PLATFORM_HOST environment variable to: ${platformConnection.platformUrl}`,
      );
      logger.debug("Setting API_KEY environment variable.");
      env["API_KEY"] = platformConnection.apiToken!;
      env["PLATFORM_HOST"] = platformConnection.platformUrl;
      Object.assign(
        env,
        await getProxyEnv(platformConnection.platformUrl, undefined, config, logger),
      );
    }
  }

  try {
    debug(cli, args, env, logger);
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
  ast: any,
): Promise<Audit> {
  const documentUri: string = document.uri.toString();

  const [grades, issues, _badIssues] = await splitReportByDocument(document, report, ast, cache);

  const filename = basename(document.fileName);

  const mainPath = document.uri.fsPath;
  const mainDir = path.dirname(mainPath);
  const files: Audit["files"] = {
    [documentUri]: { relative: path.relative(mainDir, document.uri.fsPath) },
  };

  const result = {
    valid: report.valid,
    openapiState: report.openapiState,
    minimalReport: report.minimalReport,
    summary: {
      ...grades,
      documentUri,
      subdocumentUris: [],
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
  cache: Cache,
): Promise<[Grades, IssuesByDocument, ReportedIssue[]]> {
  const grades = readSummary(report);
  const reportedIssues = readAssessment(report);

  const [issuesPerDocument, badIssues] = processIssues(mainDocument, cache, reportedIssues);

  const issues: IssuesByDocument = {};
  for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
    issues[uri] = [];
    reportedIssues.forEach((issue: ReportedIssue) => {
      console.log("issue", issue);
      const [startLine, startCol, endLine, endCol] = issue?.absoluteLocation || [0, 0, 0, 0];
      issues[uri].push({
        ...issue,
        documentUri: uri,
        lineNo: Math.abs(startLine) - 1,
        range: new vscode.Range(
          new vscode.Position(Math.abs(startLine) - 1, Math.abs(startCol) - 1),
          new vscode.Position(Math.abs(endLine) - 1, Math.abs(endCol) - 1),
        ),
      });
    });
  }

  return [grades, issues, badIssues];
}

function processIssues(
  document: vscode.TextDocument,
  cache: Cache,
  issues: ReportedIssue[],
): [{ [uri: string]: ReportedIssue[] }, ReportedIssue[]] {
  const mainUri = document.uri;
  const issuesPerDocument: { [uri: string]: ReportedIssue[] } = {
    [mainUri.toString()]: issues,
  };
  return [issuesPerDocument, []];
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
      let description = issue.description;
      if (description === "") {
        description = "ID: " + id;
      }
      for (const occ of issue.occurrences) {
        result.push({
          id,
          description,
          pointer: occ.location,
          absoluteLocation: occ.absoluteLocation,
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
  if (assessment.warnings) {
    issues = issues.concat(transformIssues(assessment.warnings, 3));
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
  pointer: string,
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
