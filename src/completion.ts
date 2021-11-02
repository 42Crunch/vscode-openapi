import * as vscode from "vscode";
import { find, findNodeAtOffset, Path, getRootRange } from "@xliic/preserving-json-yaml-parser";

import { OpenApiVersion } from "./types";
import path from "path";
import { Cache } from "./cache";

const targetMapping = {
  [OpenApiVersion.V2]: {
    schema: "/definitions",
    items: "/definitions",
    parameters: "/parameters",
    responses: "/responses",
    properties: "/definitions",
  },
  [OpenApiVersion.V3]: {
    schema: "/components/schemas",
    responses: "/components/responses",
    parameters: "/components/parameters",
    examples: "/components/examples",
    requestBody: "/components/requestBodies",
    callbacks: "/components/callbacks",
    headers: "/components/headers",
    links: "/components/links",
    items: "/components/schemas", // for completion inside JSON Schema objects
    properties: "/components/schemas",
  },
};

function findTarget(
  root: any,
  version: OpenApiVersion,
  node: any,
  nodePath: Path
): string | undefined {
  const mapping = targetMapping[version];
  if (mapping) {
    return mapping[nodePath[nodePath.length - 1]] || mapping[nodePath[nodePath.length - 2]];
  }
}

export class CompletionItemProvider implements vscode.CompletionItemProvider {
  root: any;
  version: OpenApiVersion;
  constructor(private context: vscode.ExtensionContext, private cache: Cache) {
    cache.onDidActiveDocumentChange(async (document) => {
      if (cache.getDocumentVersion(document) !== OpenApiVersion.Unknown) {
        this.root = cache.getLastGoodDocumentAst(document);
        this.version = cache.getDocumentVersion(document);
      }
    });
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    if (!this.root) {
      return;
    }

    const line = document.lineAt(position).text;
    if (!(line.includes("$ref:") || line.includes('"$ref"'))) {
      return undefined;
    }

    const offset = document.offsetAt(position);
    const { end } = getRootRange(this.root);
    // if offset is beyond the range of the root node
    // which could happen in case of incomplete yaml node with
    // bunch of spaces at the end;
    // look for the node at the end of the root node range
    const [node, nodePath] = findNodeAtOffset(this.root, offset > end ? end : offset);

    let searchRoot = this.root;
    let fileRef = "";
    // check if we are looking for remote references
    // we are looking for reference if the line ends with # and
    // the prefix part refers to a file existing file path
    if (line.trimRight().match(".*#(\"|')?$")) {
      fileRef = line
        .substring(line.lastIndexOf(":") + 1, line.lastIndexOf("#"))
        .replace('"', "")
        .replace("'", "")
        .trim();
      try {
        const otherPath = path.normalize(path.join(path.dirname(document.uri.fsPath), fileRef));
        const otherUri = document.uri.with({ path: otherPath });
        // stat fileUri, if it does not exists an exception is thrown
        await vscode.workspace.fs.stat(otherUri);
        const otherDocument = await vscode.workspace.openTextDocument(otherUri);
        const root = this.cache.getLastGoodDocumentAst(otherDocument);
        if (root) {
          searchRoot = root;
        }
      } catch (ex) {
        // file does not exists, ignore the exception
      }
    }

    const target = findTarget(this.root, this.version, node, nodePath);
    const targetNode = target && find(searchRoot, target);
    const quoteChar =
      line.charAt(position.character) == '"' || line.charAt(position.character) == "'"
        ? line.charAt(position.character)
        : '"';
    if (targetNode) {
      // don't include trailing quote when completing YAML and
      // there are already quotes in line
      let trailingQuote = quoteChar;
      let leadingSpace = " ";
      if (line.charAt(position.character) == quoteChar) {
        leadingSpace = "";
        if (document.languageId === "yaml") {
          trailingQuote = "";
        }
      }
      const completions = targetNode.getChildren().map((child) => {
        const key = child.getKey();
        return new vscode.CompletionItem(
          `${leadingSpace}${quoteChar}${fileRef}#${target}/${key}${trailingQuote}`
        );
      });
      return completions;
    }
  }
}
