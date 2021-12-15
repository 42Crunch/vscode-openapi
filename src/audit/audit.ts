import { basename } from "path";
import * as vscode from "vscode";
import { Parsed, find } from "@xliic/preserving-json-yaml-parser";

import { Cache } from "../cache";
import { findMapping } from "../bundler";
import {
  Audit,
  AuditContext,
  Grades,
  Issue,
  IssuesByDocument,
  MappingNode,
  ReportedIssue,
} from "../types";
import { getLocationByPointer } from "./util";

export function updateAuditContext(context: AuditContext, uri: string, audit: Audit) {
  context.auditsByMainDocument[uri] = audit;

  const auditsBySubDocument = {
    [audit.summary.documentUri]: audit,
  };

  for (const uri of audit.summary.subdocumentUris) {
    auditsBySubDocument[uri] = audit;
  }

  context.auditsByDocument = {
    ...context.auditsByDocument,
    ...auditsBySubDocument,
  };
}

export async function parseAuditReport(
  cache: Cache,
  document: vscode.TextDocument,
  report: any,
  mapping: MappingNode
): Promise<Audit> {
  const documentUri: string = document.uri.toString();

  const [grades, issues, documents, badIssues] = await splitReportByDocument(
    document,
    report,
    cache,
    mapping
  );

  if (badIssues.length > 0) {
    const messages = badIssues.map(
      (issue: ReportedIssue) => `Unable to locate issue "${issue.id}" at "${issue.pointer}".`
    );
    messages.unshift(
      "Some issues have not been displayed, please contact support at https://support.42crunch.com with the following information:"
    );
    vscode.window.showErrorMessage(messages.join(" "));
  }

  const filename = basename(document.fileName);

  const result = {
    summary: {
      ...grades,
      documentUri,
      subdocumentUris: Object.keys(documents).filter((uri) => uri != documentUri),
    },
    issues,
    filename,
  };

  return result;
}

async function splitReportByDocument(
  mainDocument: vscode.TextDocument,
  report: any,
  cache: Cache,
  mappings
): Promise<[Grades, IssuesByDocument, { [uri: string]: vscode.TextDocument }, ReportedIssue[]]> {
  const grades = readSummary(report);
  const reportedIssues = readAssessment(report);

  const [mainRoot, documentUris, issuesPerDocument, badIssues] = await processIssues(
    mainDocument,
    cache,
    mappings,
    reportedIssues
  );

  const files: { [uri: string]: [vscode.TextDocument, Parsed] } = {
    [mainDocument.uri.toString()]: [mainDocument, mainRoot],
  };

  // load and parse all documents
  for (const uri of documentUris) {
    if (!files[uri]) {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
      const root = cache.getLastGoodDocumentAst(document);
      files[uri] = [document, root];
    }
  }

  const issues: IssuesByDocument = {};
  for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
    const [document, root] = files[uri];
    issues[uri] = reportedIssues.map((issue: ReportedIssue): Issue => {
      const [lineNo, range] = getLocationByPointer(document, root, issue.pointer);
      return {
        ...issue,
        documentUri: uri,
        lineNo,
        range,
      };
    });
  }

  const documents = {};
  for (const [uri, [document, root]] of Object.entries(files)) {
    documents[uri] = document;
  }

  return [grades, issues, documents, badIssues];
}

function processIssues(
  document: vscode.TextDocument,
  cache: Cache,
  mappings,
  issues: ReportedIssue[]
): [Parsed, string[], { [uri: string]: ReportedIssue[] }, ReportedIssue[]] {
  const mainUri = document.uri;
  const documentUris: { [uri: string]: boolean } = { [mainUri.toString()]: true };
  const issuesPerDocument: { [uri: string]: ReportedIssue[] } = {};
  const badIssues: ReportedIssue[] = [];

  const root = cache.getLastGoodDocumentAst(document);

  for (const issue of issues) {
    const location = findIssueLocation(mainUri, root, mappings, issue.pointer);
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

function readAssessment(assessment): ReportedIssue[] {
  let issues: ReportedIssue[] = [];
  const jsonPointerIndex = assessment.index;

  function transformScore(score: number): string {
    const rounded = Math.abs(Math.round(score));
    if (score === 0) {
      return "0";
    } else if (rounded >= 1) {
      return rounded.toString();
    }
    return "less than 1";
  }

  function transformIssues(issues, defaultCriticality: number = 5): ReportedIssue[] {
    const result = [];
    for (const id of Object.keys(issues)) {
      const issue = issues[id];
      for (const subIssue of issue.issues) {
        result.push({
          id,
          description: subIssue.specificDescription
            ? subIssue.specificDescription
            : issue.description,
          pointer: jsonPointerIndex[subIssue.pointer],
          score: subIssue.score ? Math.abs(subIssue.score) : 0,
          displayScore: transformScore(subIssue.score ? subIssue.score : 0),
          criticality: issue.criticality ? issue.criticality : defaultCriticality,
        });
      }
    }

    return result;
  }

  if (assessment.data) {
    issues = issues.concat(transformIssues(assessment.data.issues));
  }

  if (assessment.security) {
    issues = issues.concat(transformIssues(assessment.security.issues));
  }

  if (assessment.warnings) {
    issues = issues.concat(transformIssues(assessment.warnings.issues, 1));
  }

  if (assessment.semanticErrors) {
    issues = issues.concat(transformIssues(assessment.semanticErrors.issues));
  }

  if (assessment.validationErrors) {
    issues = issues.concat(transformIssues(assessment.validationErrors.issues));
  }

  issues.sort((a, b) => b.score - a.score);

  return issues;
}

function readSummary(assessment): Grades {
  const grades = {
    datavalidation: {
      value: Math.round(assessment.data ? assessment.data.score : 0),
      max: 70,
    },
    security: {
      value: Math.round(assessment.security ? assessment.security.score : 0),
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

  grades.all = grades.datavalidation.value + grades.security.value + grades.oasconformance.value;

  return grades;
}

function findIssueLocation(
  mainUri: vscode.Uri,
  root: Parsed,
  mappings,
  pointer
): [string, string] | undefined {
  const node = find(root, pointer);
  if (node) {
    return [mainUri.toString(), pointer];
  } else {
    const mapping = findMapping(mappings, pointer);
    if (mapping.hash) {
      return [mapping.uri, mapping.hash];
    }
  }
}
