import * as vscode from "vscode";
import {
  find,
  findNodeAtOffset,
  Path,
  getRootRange,
  Parsed,
} from "@xliic/preserving-json-yaml-parser";

import { OpenApiVersion } from "./types";
import path from "path";
import { Cache } from "./cache";

const targetMapping: { [key in OpenApiVersion]: any } = {
  [OpenApiVersion.Unknown]: undefined,
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

export class CompletionItemProvider implements vscode.CompletionItemProvider {
  parsed?: Parsed;
  version: OpenApiVersion = OpenApiVersion.Unknown;
  constructor(private context: vscode.ExtensionContext, private cache: Cache) {
    cache.onDidActiveDocumentChange(async (document: vscode.TextDocument | undefined) => {
      if (document && cache.getDocumentVersion(document) !== OpenApiVersion.Unknown) {
        this.parsed = cache.getLastGoodParsedDocument(document);
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
    const line = document.lineAt(position).text;

    if (!this.parsed || !line.includes("$ref")) {
      return undefined;
    }

    const nodePath = findPathAtOffset(
      this.parsed,
      document.offsetAt(position),
      document.languageId
    );
    const targetPointer = findTargetPointer(this.version, nodePath);
    const refContext = await getRefContext(this.parsed, line, document.uri, this.cache);

    if (targetPointer && refContext) {
      const targetNode = targetPointer && find(refContext.parsed, targetPointer);
      if (targetNode) {
        // YAML and JSON editors are slightly different in terms of completions
        // depending on the editor completion might be not shown if
        // completion items dont start with present/absent quotes, etc
        if (document.languageId === "yaml") {
          const openingQuote = refContext.pointer === "" ? refContext.openingQuote : "";
          return Object.keys(targetNode).map((key: string) => {
            return new vscode.CompletionItem(
              `${openingQuote}#${targetPointer}/${key}${refContext.closingQuote}`,
              vscode.CompletionItemKind.Reference
            );
          });
        } else {
          return Object.keys(targetNode).map((key: string) => {
            return new vscode.CompletionItem(
              `"${refContext.filename}#${targetPointer}/${key}"`,
              vscode.CompletionItemKind.Reference
            );
          });
        }
      }
    }
  }
}

async function getRefContext(
  parsed: Parsed,
  line: string,
  baseUri: vscode.Uri,
  cache: Cache
): Promise<
  | {
      parsed: Parsed;
      openingQuote: string;
      closingQuote: string;
      filename: string;
      pointer: string;
    }
  | undefined
> {
  const refRe = /^\S+\s+(['"]?)([^"^'^\s]*)(['"]?)$/;
  const match = line.trim().match(refRe);
  if (match) {
    const [_, openingQuote, content, closingQuote] = match;
    // TODO unquoted
    if (content === "") {
      return { parsed, openingQuote, closingQuote: "", filename: "", pointer: "" };
    }
    if (content.startsWith("#")) {
      return { parsed, openingQuote, closingQuote: "", filename: "", pointer: content };
    }

    const filename = content.substring(0, content.indexOf("#"));
    const pointer = content.substring(content.indexOf("#"), content.length);

    const normalized = path.normalize(path.join(path.dirname(baseUri.fsPath), filename));
    const uri = baseUri.with({ path: normalized });
    try {
      // stat uri, if it does not exists an exception is thrown
      await vscode.workspace.fs.stat(uri);
      const document = await vscode.workspace.openTextDocument(uri);
      const parsed = cache.getLastGoodParsedDocument(document);
      if (parsed) {
        return { parsed, openingQuote, closingQuote: "", filename, pointer };
      }
    } catch (ex) {
      return undefined;
    }
  } else {
    return { parsed, openingQuote: '"', closingQuote: '"', filename: "", pointer: "" };
  }
}

function findPathAtOffset(parsed: Parsed, offset: number, languageId: string): Path {
  const { end } = getRootRange(parsed);
  // if offset is beyond the range of the root node
  // which could happen in case of incomplete yaml node with
  // bunch of spaces at the end;
  // look for the node at the end of the root node range
  let [node, nodePath] = findNodeAtOffset(parsed, offset > end ? end : offset);
  if (languageId === "yaml") {
    // workaround implicit null issue for the YAML like this ```$ref:```
    const [betterNode, betterNodePath] = findNodeAtOffset(
      parsed,
      offset > end ? end - 1 : offset - 1
    );
    if (betterNode && betterNode.hasOwnProperty("$ref") && betterNode["$ref"] === null) {
      return betterNodePath;
    }
  }
  return nodePath;
}

function findTargetPointer(version: OpenApiVersion, nodePath: Path): string | undefined {
  const mapping = targetMapping[version];
  if (mapping) {
    return mapping[nodePath[nodePath.length - 1]] || mapping[nodePath[nodePath.length - 2]];
  }
}
