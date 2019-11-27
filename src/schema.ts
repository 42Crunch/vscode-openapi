/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class OpenapiSchemaContentProvider implements vscode.TextDocumentContentProvider {
  constructor(private context: vscode.ExtensionContext) {}

  public provideTextDocumentContent(uri: vscode.Uri): string {
    const filename = path.join(this.context.extensionPath, 'schema', uri.path);
    const contents = fs.readFileSync(filename, { encoding: 'utf8' });
    return contents;
  }
}
