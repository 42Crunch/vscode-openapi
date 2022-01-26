/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import got from "got";
import FormData from "form-data";

const ASSESS_URL = "https://stateless.42crunch.com/api/v1/anon/assess/vscode";
const TOKEN_URL = "https://stateless.42crunch.com/api/v1/anon/token";
const ARTICLES_URL = "https://platform.42crunch.com/kdb/audit-with-yaml.json";

let cachedArticles: Promise<any> | undefined = undefined;

export async function getArticles(): Promise<any> {
  if (cachedArticles === undefined) {
    cachedArticles = downloadArticles();
  }
  return cachedArticles;
}

async function downloadArticles(): Promise<any> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Loading API Contract Security Audit KDB Articles...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<any> => {
      try {
        const response = await got(ARTICLES_URL);
        return JSON.parse(response.body);
      } catch (error) {
        throw new Error(`Failed to read articles.json: ${error}`);
      }
    }
  );
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestToken(email: string) {
  const response = await got(TOKEN_URL, {
    method: "POST",
    form: { email },
    headers: {
      Accept: "application/json",
    },
  });

  return JSON.parse(response.body);
}

async function submitAudit(text: string, apiToken: string) {
  const form = new FormData();
  form.append("specfile", text, {
    filename: "swagger.json",
    contentType: "application/json",
  });

  const response = await got(ASSESS_URL, {
    method: "POST",
    body: form,
    headers: {
      Accept: "application/json",
      "X-API-TOKEN": apiToken,
    },
  });

  return JSON.parse(response.body);
}

async function retryAudit(token: string, apiToken: string) {
  const response = await got(`ASSESS_URL?token=${token}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-API-TOKEN": apiToken,
    },
  });
  return JSON.parse(response.body);
}

export async function audit(
  text: string,
  apiToken: string,
  progress: vscode.Progress<any>
): Promise<any> {
  let result = await submitAudit(text, apiToken);

  if (result.status === "IN_PROGRESS") {
    for (let attempt = 0; attempt < 20; attempt++) {
      await delay(5000);
      if (attempt === 2) {
        progress.report({
          message: "Processing takes longer than expected, please wait...",
        });
      }

      const retry = await retryAudit(result.token, apiToken);

      if (retry.status === "PROCESSED") {
        result = retry;
        break;
      }
    }
  }

  if (result.status === "PROCESSED") {
    return result.report;
  }

  throw new Error("Failed to retrieve audit result");
}
