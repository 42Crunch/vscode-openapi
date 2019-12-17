import * as vscode from 'vscode';
import { Node, YamlNode, JsonNode } from './ast';
import { getOpenApiVersion } from './util';
import { OpenApiVersion } from './constants';

const targetMapping = {
  [OpenApiVersion.V2]: {
    schema: '/definitions',
    items: '/definitions',
    parameters: '/parameters',
    responses: '/responses',
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
  },
};

function findTarget(root: Node, node: Node): string | undefined {
  const mapping = targetMapping[getOpenApiVersion(root)];
  if (mapping) {
    return (
      mapping[node.getParent()?.getKey()] ||
      mapping[
        node
          .getParent()
          ?.getParent()
          ?.getKey()
      ]
    );
  }
}

export class YamlCompletionItemProvider implements vscode.CompletionItemProvider {
  root: YamlNode;
  constructor(
    private context: vscode.ExtensionContext,
    private didChangeTree: vscode.Event<[Node, vscode.TextDocumentChangeEvent]>,
  ) {
    didChangeTree(([node, changeEvent]) => {
      this.root = <YamlNode>node;
    });
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ) {
    const line = document.lineAt(position).text;
    if (!line.includes('$ref: ')) {
      return undefined;
    }

    const offset = document.offsetAt(position);
    const node = this.root.findNodeAtOffset(offset);

    const target = findTarget(this.root, node);
    const targetNode = target && this.root.find(target);
    if (targetNode) {
      const completions = targetNode.getChildren().map(child => {
        const key = child.getKey();
        return new vscode.CompletionItem(`#${target}/${key}`);
      });
      return completions;
    }
  }
}
