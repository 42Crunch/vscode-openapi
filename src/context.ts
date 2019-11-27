/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from 'vscode';
import { Node } from './ast';

export function updateContext(didChangeTree: vscode.Event<[Node, vscode.TextDocumentChangeEvent]>) {
  didChangeTree(([tree, _changeEvent]) => {
    if (tree) {
      checkTree(tree);
    }
  });
}

function checkTree(tree: Node) {
  setContext('openapiMissingHost', isMissing(tree, '/host'));
  setContext('openapiMissingBasePath', isMissing(tree, '/basePath'));
  setContext('openapiMissingInfo', isMissing(tree, '/info'));
}

function isMissing(tree: Node, pointer: string): boolean {
  return !tree.find(pointer);
}

function setContext(name: string, value: boolean) {
  vscode.commands.executeCommand('setContext', name, value);
}
