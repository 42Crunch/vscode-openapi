import * as vscode from 'vscode';
import { Node, parse } from './ast';
import { getOpenApiVersion } from './util';
import { OpenApiVersion } from './constants';
import { parserOptions } from './parser-options';
import path from 'path';

const targetMapping = {
  [OpenApiVersion.V2]: {
    schema: '/definitions',
    items: '/definitions',
    parameters: '/parameters',
    responses: '/responses',
    properties: '/definitions',
  },
  [OpenApiVersion.V3]: {
    schema: '/components/schemas',
    responses: '/components/responses',
    parameters: '/components/parameters',
    examples: '/components/examples',
    requestBody: '/components/requestBodies',
    callbacks: '/components/callbacks',
    headers: '/components/headers',
    links: '/components/links',
    items: '/components/schemas', // for completion inside JSON Schema objects
    properties: '/components/schemas',
  },
};

function findTarget(root: Node, node: Node): string | undefined {
  const mapping = targetMapping[getOpenApiVersion(root)];
  if (mapping) {
    return mapping[node.getParent()?.getKey()] || mapping[node.getParent()?.getParent()?.getKey()];
  }
}

export class CompletionItemProvider implements vscode.CompletionItemProvider {
  root: Node;
  constructor(
    private context: vscode.ExtensionContext,
    private didChangeTree: vscode.Event<[Node, vscode.TextDocumentChangeEvent]>,
  ) {
    didChangeTree(([node, changeEvent]) => {
      this.root = node;
    });
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ) {
    const line = document.lineAt(position).text;
    if (!(line.includes('$ref:') || line.includes('"$ref"'))) {
      return undefined;
    }

    const offset = document.offsetAt(position);
    const [start, end] = this.root.getRange();
    // if offset is beyond the range of the root node
    // which could happen in case of incomplete yaml node with
    // bunch of spaces at the end;
    // look for the node at the end of the root node range
    const node = this.root.findNodeAtOffset(offset > end ? end : offset);

    let searchRoot = this.root;
    let fileRef = '';
    // check if we are looking for remote references
    // we are looking for reference if the line ends with # and
    // the prefix part refers to a file existing file path
    if (line.trimRight().match('.*#("|\')?$')) {
      fileRef = line
        .substring(line.lastIndexOf(':') + 1, line.lastIndexOf('#'))
        .replace('"', '')
        .replace("'", '')
        .trim();
      try {
        const otherPath = path.normalize(path.join(path.dirname(document.uri.fsPath), fileRef));
        const otherUri = document.uri.with({ path: otherPath });
        // stat fileUri, if it does not exists an exception is thrown
        await vscode.workspace.fs.stat(otherUri);
        const otherDocument = await vscode.workspace.openTextDocument(otherUri);
        const [root, errors] = parse(otherDocument.getText(), otherDocument.languageId, parserOptions);
        if (!errors.length) {
          searchRoot = root;
        }
      } catch (ex) {
        // file does not exists, ignore the exception
      }
    }

    const target = findTarget(this.root, node);
    const targetNode = target && searchRoot.find(target);
    const qouteChar =
      line.charAt(position.character) == '"' || line.charAt(position.character) == "'"
        ? line.charAt(position.character)
        : '"';
    if (targetNode) {
      // don't include trailing quote when completing YAML and
      // there are already quotes in line
      let trailingQuote = qouteChar;
      let leadingSpace = ' ';
      if (line.charAt(position.character) == qouteChar) {
        leadingSpace = '';
        if (document.languageId === 'yaml') {
          trailingQuote = '';
        }
      }
      const completions = targetNode.getChildren().map((child) => {
        const key = child.getKey();
        return new vscode.CompletionItem(`${leadingSpace}${qouteChar}${fileRef}#${target}/${key}${trailingQuote}`);
      });
      return completions;
    }
  }
}
