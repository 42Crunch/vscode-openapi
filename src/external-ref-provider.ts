/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { CancellationToken, TextDocumentContentProvider, Uri } from "vscode";
import got from "got";

const SCHEMES = {
  "openapi-external-http": "http",
  "openapi-external-https": "https",
};

export class ExternalRefDocumentProvider implements TextDocumentContentProvider {
  async provideTextDocumentContent(uri: Uri, token: CancellationToken): Promise<string> {
    const actualUri = uri.with({ scheme: SCHEMES[uri.scheme] });
    const response = await got(actualUri.toString());
    return response.body;
  }
}
