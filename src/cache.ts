/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { extname } from "path";
import * as vscode from "vscode";
import { BundleResult } from "./types";
import { OpenApiVersion } from "./types";
import { parseToAst, parseToObject } from "./parsers";
import { ParserOptions } from "./parser-options";
import { bundle } from "./bundler";
import { joinJsonPointer } from "./pointer";
import { Node } from "@xliic/openapi-ast-node";
import { configuration } from "./configuration";

interface CacheEntry {
  document: vscode.TextDocument;
  documentVersion: number;
  uri: vscode.Uri;
  version: OpenApiVersion;
  astRoot: Node;
  lastGoodAstRoot: Node;
  parsed: any;
  errors: any;
  bundle?: BundleResult;
}

export class Cache {
  private cache: { [uri: string]: CacheEntry } = {};
  private lastUpdate: { [uri: string]: number } = {};
  private pendingUpdates: { [uri: string]: Promise<CacheEntry> } = {};

  private parserOptions: ParserOptions;
  private _didChange = new vscode.EventEmitter<vscode.TextDocument>();
  private _didActiveDocumentChange = new vscode.EventEmitter<vscode.TextDocument>();

  private diagnostics = vscode.languages.createDiagnosticCollection("openapi-bundler");
  private selector: vscode.DocumentSelector;

  constructor(parserOptions: ParserOptions, selector: vscode.DocumentSelector) {
    this.parserOptions = parserOptions;
    this.selector = selector;
    configuration.onDidChange(async () => {
      const editor = vscode.window.activeTextEditor;
      const uri = editor?.document?.uri?.toString();
      if (this.cache[uri]) {
        this.requestCacheEntryUpdateForActiveDocument(editor.document);
      }
    });
  }

  get onDidChange(): vscode.Event<vscode.TextDocument> {
    return this._didChange.event;
  }

  get onDidActiveDocumentChange(): vscode.Event<vscode.TextDocument> {
    return this._didActiveDocumentChange.event;
  }

  async onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    const activeDocument = vscode.window?.activeTextEditor.document;
    if (
      activeDocument === event.document &&
      vscode.languages.match(this.selector, activeDocument) > 0
    ) {
      this.requestCacheEntryUpdateForActiveDocument(event.document);
    }
  }

  // TODO track on close events and clear non-json documents

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    // TODO don't re-parse if we've got up-to-date contents in the cache
    // compare documentVersion
    if (editor && vscode.languages.match(this.selector, editor.document) > 0) {
      this.requestCacheEntryUpdateForActiveDocument(editor.document);
    }
  }

  getDocumentVersion(document: vscode.TextDocument): OpenApiVersion {
    const entry = this.cache[document.uri.toString()];
    return entry ? entry.version : OpenApiVersion.Unknown;
  }

  getDocumentVersionByDocumentUri(uri: string): OpenApiVersion {
    const entry = this.cache[uri];
    return entry ? entry.version : OpenApiVersion.Unknown;
  }

  async getDocumentAst(document: vscode.TextDocument): Promise<Node> {
    const entry = await this.getCacheEntry(document);
    return entry.astRoot;
  }

  async getLastGoodDocumentAst(document: vscode.TextDocument): Promise<Node> {
    const entry = await this.getCacheEntry(document);
    return entry.lastGoodAstRoot;
  }

  async getDocumentValue(document: vscode.TextDocument): Promise<any> {
    const entry = await this.getCacheEntry(document);
    return entry.parsed;
  }

  getCachedDocumentValueByUri(uri: vscode.Uri): any {
    return this.cache[uri.toString()]?.parsed;
  }

  getDocumentBundleByDocumentUri(uri: string): any {
    return this.cache[uri]?.bundle;
  }

  async getDocumentBundle(document: vscode.TextDocument): Promise<BundleResult> {
    const entry = await this.getCacheEntry(document);
    if (!entry.bundle) {
      await this.bundleCacheEntry(document, entry);
    }
    return entry.bundle;
  }

  private buildCacheEntry(document: vscode.TextDocument): CacheEntry {
    const [version, node, errors] = parseToAst(document, this.parserOptions);
    let value = null;
    let lastGoodAstRoot = null;

    // produce value only if no errors encountered
    if (!errors && version !== OpenApiVersion.Unknown) {
      lastGoodAstRoot = node;
    }

    if (!errors && node !== null) {
      value = parseToObject(document, this.parserOptions);
    }

    return {
      document,
      documentVersion: document.version,
      uri: document.uri,
      version,
      astRoot: node,
      lastGoodAstRoot,
      parsed: value,
      errors,
    };
  }

  private async bundleCacheEntry(
    document: vscode.TextDocument,
    entry: CacheEntry
  ): Promise<CacheEntry> {
    // bundle if it is OpenAPI file and no parsing errors
    if (entry.version !== OpenApiVersion.Unknown && !entry.errors) {
      const approvedHosts = configuration.get<string[]>("approvedHostnames");
      entry.bundle = await bundle(document, entry.version, entry.parsed, this, approvedHosts);
      // show or clear bundling errors
      if ("errors" in entry.bundle) {
        this.showBundlerErrors(document.uri, entry.bundle.errors);
      } else {
        this.clearBundlerErrors(entry.bundle.uris);
      }
    }

    return entry;
  }

  async updateCacheEntry(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();
    const old = this.cache[uri];
    const entry = this.buildCacheEntry(document);

    if (!entry.lastGoodAstRoot && old?.lastGoodAstRoot) {
      entry.lastGoodAstRoot = old.lastGoodAstRoot;
    }

    this.cache[uri] = entry;

    if (vscode.window?.activeTextEditor?.document === document) {
      this._didActiveDocumentChange.fire(document);
    }
    this._didChange.fire(document);
    return entry;
  }

  async requestCacheEntryUpdateForActiveDocument(document: vscode.TextDocument): Promise<void> {
    const MAX_UPDATE = 1000; // update no more ofent than
    const uri = document.uri.toString();
    const now = Date.now();
    const lastUpdate = this.lastUpdate[uri];
    const pending = this.pendingUpdates[uri];

    if (!lastUpdate) {
      // first update
      this.lastUpdate[uri] = now;
      await this.bundleCacheEntry(document, await this.updateCacheEntry(document));
    } else if (!pending) {
      // if no update is pending request a new one
      const sinceLastUpdate = now - lastUpdate;
      const updateDelay = MAX_UPDATE > sinceLastUpdate ? MAX_UPDATE - sinceLastUpdate : 0;

      this.pendingUpdates[uri] = new Promise<CacheEntry>((resolve, reject) => {
        setTimeout(async () => {
          const entry = await this.bundleCacheEntry(
            document,
            await this.updateCacheEntry(document)
          );
          this.lastUpdate[uri] = Date.now();
          delete this.pendingUpdates[uri];
          resolve(entry);
        }, updateDelay);
      });
    }
  }

  async getCacheEntry(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();

    if (this.cache[uri] && this.cache[uri].documentVersion === document.version) {
      return this.cache[uri];
    } else if (this.pendingUpdates[uri]) {
      return this.pendingUpdates[uri];
    }

    const promise = this.updateCacheEntry(document);
    this.lastUpdate[uri] = Date.now();
    this.pendingUpdates[uri] = promise;

    return promise;
  }

  private showBundlerErrors(documentUri: vscode.Uri, errors: any) {
    if (!errors.errors || errors.errors.length == 0) {
      vscode.window.showErrorMessage(
        `Unexpected error when trying to process ${documentUri}: ${errors}`
      );
      return;
    }

    const uniqueErrors = [];
    const exists = (error) =>
      uniqueErrors.some(
        (element) =>
          element?.message === error?.message &&
          element?.source === error?.source &&
          element?.code === error?.code &&
          element?.path.join() === error?.path.join()
      );

    for (const error of errors.errors) {
      if (!exists(error)) {
        uniqueErrors.push(error);
      }
    }

    const resolverErrors: { [uri: string]: any[] } = {};

    for (const error of uniqueErrors) {
      const source = error.source;

      // if source has no extension, assume it is the base document
      const uri = extname(source) === "" ? documentUri : documentUri.with({ path: source });
      if (!resolverErrors[uri.toString()]) {
        resolverErrors[uri.toString()] = [];
      }

      const message: any = {
        message: `Failed to resolve reference: ${error.message}`,
        path: error.path,
      };

      if (error.code === "ERESOLVER" && error?.ioErrorCode?.startsWith("rejected:")) {
        message.rejectedHost = error.ioErrorCode.substring("rejected:".length);
      }

      resolverErrors[uri.toString()].push(message);
    }

    for (const key of Object.keys(resolverErrors)) {
      const uri = vscode.Uri.parse(key);
      const entry = this.cache[uri.toString()];
      if (!entry) {
        continue;
      }

      const messages = [];
      for (const { path, message, rejectedHost } of resolverErrors[key]) {
        // use pointer to $ref
        const refPointer = joinJsonPointer([...path, "$ref"]);
        let node = entry.astRoot.find(refPointer);
        if (!node) {
          // if not found, fall back to the original pointer
          const origPointer = joinJsonPointer(path);
          node = entry.astRoot.find(origPointer);
        }
        const [start, end] = node.getRange();
        const position = entry.document.positionAt(start);
        const line = entry.document.lineAt(position.line);
        const range = new vscode.Range(
          new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
          new vscode.Position(position.line, line.range.end.character)
        );

        const additionalProperties: any = {};

        if (rejectedHost) {
          additionalProperties.rejectedHost = rejectedHost;
          additionalProperties.code = "rejected";
        }

        messages.push({
          message,
          range,
          severity: vscode.DiagnosticSeverity.Error,
          ...additionalProperties,
        });
      }
      this.diagnostics.set(uri, messages);
    }
  }

  private clearBundlerErrors(uris: Set<string>) {
    for (const uri of uris) {
      this.diagnostics.delete(vscode.Uri.parse(uri));
    }
  }
}
