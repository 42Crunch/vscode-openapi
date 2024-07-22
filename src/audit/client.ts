/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import got from "got";

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
      title: "Loading API Security Audit KDB Articles...",
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
