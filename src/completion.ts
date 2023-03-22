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

    const refRe = /^(\s*)(['"]?\$ref['"\s]*:(.*))$/;

    const match = line.match(refRe);
    if (match && targetPointer) {
      // don't replace trailing comma if there is one
      const refLen = match[2].endsWith(",") ? match[2].length - 1 : match[2].length;

      const replacing = new vscode.Range(
        new vscode.Position(position.line, match[1].length),
        new vscode.Position(position.line, match[1].length + refLen)
      );

      const inserting = new vscode.Range(
        new vscode.Position(position.line, match[1].length),
        position
      );

      const rc = await getRefContext(this.parsed, match[3], document.uri, this.cache);

      const targetNode = find(rc!.parsed, targetPointer);
      if (targetNode) {
        return Object.keys(targetNode).map((key: string) => {
          const item = new vscode.CompletionItem(
            `${rc.filename}#${targetPointer}/${key}`,
            vscode.CompletionItemKind.Reference
          );
          item.range = { replacing, inserting };
          if (document.languageId === "yaml") {
            const oq = rc.openingQuote === "" ? '"' : rc.openingQuote;
            const cq = rc.closingQuote === "" ? '"' : "";
            item.insertText = `$ref: ${oq}${rc.filename}#${targetPointer}/${key}${cq}`;
            item.filterText = `$ref: ${rc.openingQuote}${rc.filename}#${targetPointer}/${key}${rc.closingQuote}`;
          } else {
            item.insertText = `"$ref": "${rc.filename}#${targetPointer}/${key}"`;
            item.filterText = `"$ref": "${rc.filename}#${targetPointer}/${key}"`;
          }
          return item;
        });
      }
    }
  }
}

async function getRefContext(
  parsed: Parsed,
  content: string,
  baseUri: vscode.Uri,
  cache: Cache
): Promise<{
  parsed: Parsed;
  filename: string;
  pointer: string;
  openingQuote: string;
  closingQuote: string;
}> {
  const trimmed = content.trim();
  const openingQuote = trimmed.startsWith('"') ? '"' : trimmed.startsWith("'") ? "'" : "";
  const closingQuote = trimmed.endsWith('"') ? '"' : trimmed.endsWith("'") ? "'" : "";
  const match = trimmed.match(/(['"])?([^"']*)(\1)?(?:,|$)/);

  if (match !== null && match[2].trim() !== "") {
    if (match[2].startsWith("#")) {
      // local reference
      return { parsed, filename: "", pointer: match[2], openingQuote, closingQuote };
    } else if (match[2].includes("#")) {
      // external reference
      const filename = match[2].substring(0, match[2].indexOf("#"));
      const pointer = match[2].substring(match[2].indexOf("#"), match[2].length);
      const normalized = path.normalize(path.join(path.dirname(baseUri.fsPath), filename));
      const uri = baseUri.with({ path: normalized });
      try {
        // stat uri, if it does not exists an exception is thrown
        await vscode.workspace.fs.stat(uri);
        const document = await vscode.workspace.openTextDocument(uri);
        const parsed = cache.getLastGoodParsedDocument(document);
        if (parsed) {
          return { parsed, filename, pointer, openingQuote, closingQuote };
        }
      } catch (ex) {}
    }
  }

  return { parsed, filename: "", pointer: "", openingQuote, closingQuote };
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
    return (
      mapping[nodePath[nodePath.length - 1]] ||
      mapping[nodePath[nodePath.length - 2]] ||
      mapping[nodePath[nodePath.length - 3]]
    );
  }
}
