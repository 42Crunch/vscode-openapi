/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import got from 'got';
import FormData from 'form-data';

const ASSESS_URL = 'https://stateless.apisecurity.io/api/v1/anon/assess/vscode';
const TOKEN_URL = 'https://stateless.apisecurity.io/api/v1/anon/token';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function requestToken(email: string) {
  const response = await got(TOKEN_URL, {
    body: { email },
    form: true,
    headers: {
      Accept: 'application/json',
    },
  });

  return JSON.parse(response.body);
}

async function submitAudit(text: string, apiToken: string) {
  const form = new FormData();
  form.append('specfile', text, {
    filename: 'swagger.json',
    contentType: 'application/json',
  });

  const response = await got(ASSESS_URL, {
    body: form,
    headers: {
      Accept: 'application/json',
      'X-API-TOKEN': apiToken,
    },
  });

  return JSON.parse(response.body);
}

async function retryAudit(token: string, apiToken: string) {
  const response = await got(`ASSESS_URL?token=${token}`, {
    headers: {
      Accept: 'application/json',
      'X-API-TOKEN': apiToken,
    },
  });
  return JSON.parse(response.body);
}

export async function audit(
  text: string,
  apiToken: string,
  progress: vscode.Progress<any>,
  cancellationToken: vscode.CancellationToken,
): Promise<[any, any[]]> {
  let result = await submitAudit(text, apiToken);

  if (result.status === 'IN_PROGRESS') {
    for (let attempt = 0; attempt < 20; attempt++) {
      await delay(5000);
      if (attempt === 2) {
        progress.report({
          message: 'Processing takes longer than expected, please wait...',
        });
      }

      const retry = await retryAudit(result.token, apiToken);

      if (retry.status === 'PROCESSED') {
        result = retry;
        break;
      }
    }
  }

  if (result.status === 'PROCESSED') {
    return [readSummary(result.report), readAssessment(result.report)];
  } else {
    // fail with message
  }
}

function readSummary(assessment) {
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
  };

  if (assessment.semanticErrors || assessment.validationErrors) {
    grades.errors = true;
  }

  grades.all = grades.datavalidation.value + grades.security.value + grades.oasconformance.value;

  return grades;
}

function readAssessment(assessment): any[] {
  let issues = [];
  const jsonPointerIndex = assessment.index;

  function transformId(id: string) {
    return id
      .split('.')
      .join('-')
      .toLowerCase();
  }

  function transformScore(score: number, maxFractionDigits: number) {
    let fractionDigits = 0;
    let step = 1;
    while (score < step && fractionDigits <= maxFractionDigits) {
      step = step / 10;
      fractionDigits++;
    }

    if (fractionDigits > maxFractionDigits) {
      return '0';
    }

    const scoreAsString = score.toFixed(fractionDigits);
    const result = scoreAsString.replace(/[0]+$/, '');

    return result;
  }

  function transformIssues(issues, defaultCriticality: number = 5) {
    const result = [];
    for (const id of Object.keys(issues)) {
      const issue = issues[id];
      for (const subIssue of issue.issues) {
        result.push({
          id: transformId(id),
          description: subIssue.specificDescription ? subIssue.specificDescription : issue.description,
          pointer: jsonPointerIndex[subIssue.pointer],
          score: subIssue.score ? Math.abs(subIssue.score) : 0,
          displayScore: transformScore(subIssue.score ? Math.abs(subIssue.score) : 0, 5),
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