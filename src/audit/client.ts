/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import got from "got";

import { getEndpoints } from "@xliic/common/endpoints";

let cachedArticles: Promise<any> | undefined = undefined;

export async function getArticles(useDevEndpoints: boolean): Promise<any> {
  if (cachedArticles === undefined) {
    cachedArticles = downloadArticles(useDevEndpoints);
  }
  return cachedArticles;
}

async function downloadArticles(useDevEndpoints: boolean): Promise<any> {
  const { kdbUrl } = getEndpoints(useDevEndpoints);
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Loading API Security Audit KDB Articles...",
      cancellable: false,
    },
    async (progress, cancellationToken): Promise<any> => {
      try {
        const response = await got(kdbUrl);
        return JSON.parse(response.body);
      } catch (error) {
        throw new Error(`Failed to read articles.json: ${error}`);
      }
    }
  );
}

export async function requestToken(email: string, useDevEndpoints: boolean): Promise<any> {
  const { freemiumdUrl } = getEndpoints(useDevEndpoints);
  const response = await got(`${freemiumdUrl}/api/v1/anon/token`, {
    method: "POST",
    form: { email },
    headers: {
      Accept: "application/json",
    },
  });

  return JSON.parse(response.body);
}
