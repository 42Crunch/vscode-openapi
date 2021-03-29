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
import { ExternalRefDocumentProvider } from "./external-refs";

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
  private cache = new Map<string, CacheEntry>();
  private lastUpdate = new Map<string, number>();
  private pendingUpdates = new Map<string, Promise<CacheEntry>>();

  private parserOptions: ParserOptions;
  private _didChange = new vscode.EventEmitter<vscode.TextDocument>();
  private _didActiveDocumentChange = new vscode.EventEmitter<vscode.TextDocument>();

  private diagnostics = vscode.languages.createDiagnosticCollection("openapi-bundler");
  private selector: vscode.DocumentSelector;
  private externalRefProvider: ExternalRefDocumentProvider;

  constructor(
    parserOptions: ParserOptions,
    selector: vscode.DocumentSelector,
    externalRefProvider: ExternalRefDocumentProvider
  ) {
    this.parserOptions = parserOptions;
    this.selector = selector;
    this.externalRefProvider = externalRefProvider;
    configuration.onDidChange(async () => {
      // when configuration is updated, re-bundle all bundled cache entries
      for (const entry of Object.values(this.cache)) {
        if (entry.bundle) {
          this.requestCacheEntryUpdate(entry.document);
        }
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
    if (vscode.languages.match(this.selector, event.document) === 0) {
      this._didActiveDocumentChange.fire(event.document);
    } else {
      this.requestCacheEntryUpdate(event.document);
      this._didActiveDocumentChange.fire(event.document);
    }
  }

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    if (!editor?.document || vscode.languages.match(this.selector, editor.document) === 0) {
      this._didActiveDocumentChange.fire(editor?.document);
    } else {
      this.requestCacheEntryUpdate(editor.document);
      this._didActiveDocumentChange.fire(editor.document);
    }
  }

  getDocumentVersion(document: vscode.TextDocument): OpenApiVersion {
    if (document) {
      const entry = this.cache[document.uri.toString()];
      return entry ? entry.version : OpenApiVersion.Unknown;
    }
    return OpenApiVersion.Unknown;
  }

  getDocumentVersionByDocumentUri(uri: string): OpenApiVersion {
    const entry = this.cache[uri];
    return entry ? entry.version : OpenApiVersion.Unknown;
  }

  async getDocumentAst(document: vscode.TextDocument): Promise<Node> {
    const entry = await this.getCacheEntry(document);
    if (!entry.errors) {
      return entry.astRoot;
    }
  }

  async getLastGoodDocumentAst(document: vscode.TextDocument): Promise<Node> {
    const entry = await this.getCacheEntry(document);
    return entry.lastGoodAstRoot;
  }

  async getDocumentValue(document: vscode.TextDocument): Promise<any> {
    const entry = await this.getCacheEntry(document);
    return entry.parsed;
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
    if (!errors) {
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
      entry.bundle = await bundle(
        document,
        entry.version,
        entry.parsed,
        this,
        approvedHosts,
        this.externalRefProvider
      );
      // show or clear bundling errors
      if (entry.bundle) {
        if ("errors" in entry.bundle) {
          this.showBundlerErrors(document.uri, entry.bundle.errors);
        } else {
          this.clearBundlerErrors(entry.bundle.documents);
        }
      }
    } else {
      entry.bundle = {
        errors: [],
        documents: new Map(),
      };
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
    if (!document || vscode.languages.match(this.selector, document) === 0) {
      this._didActiveDocumentChange.fire(document);
    } else {
      this.requestCacheEntryUpdate(document);
    }
  }

  // returns a list of documents for which the cache needs to be updated
  // if this particular document changes
  getAffectedDocuments(document: vscode.TextDocument): Set<vscode.TextDocument> {
    const affected = new Set<vscode.TextDocument>();

    // document needs to be updated if it's not in cache
    // or the documentVersion of cache entry is different to that of
    // the document
    const entry = this.cache.get(document.uri.toString());
    if (!entry || entry.documentVersion !== document.version) {
      affected.add(document);
    }

    // also check all cache entries which have bundles and see if
    // document belongs to a bundle, if so re-bundle the relevant
    // cache entry
    for (const entry of this.cache.values()) {
      if (entry.bundle) {
        const bundleDocument = entry.bundle.documents.get(document.uri.toString());
        if (bundleDocument && bundleDocument.version !== document.version) {
          affected.add(entry.document);
        }
      }
    }
    return affected;
  }

  getUpdateDelay(uri: string): number {
    const MAX_UPDATE = 1000; // update no more ofent than

    // zero delay if never been updated before
    if (!this.lastUpdate.has(uri)) {
      return 0;
    }

    const now = Date.now();
    const sinceLastUpdate = now - this.lastUpdate.get(uri);

    return MAX_UPDATE > sinceLastUpdate ? MAX_UPDATE - sinceLastUpdate : 0;
  }

  enqueueCacheUpdate(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();

    // enqueue the update if not already pending
    if (!this.pendingUpdates.has(uri)) {
      const updateDelay = this.getUpdateDelay(uri);
      this.pendingUpdates.set(
        uri,
        new Promise<CacheEntry>((resolve, reject) => {
          setTimeout(async () => {
            try {
              const entry = await this.bundleCacheEntry(
                document,
                await this.updateCacheEntry(document)
              );
              this.cache.set(uri, entry);
              this.lastUpdate.set(uri, Date.now());
              this.pendingUpdates.delete(uri);
              resolve(entry);
            } catch (e) {
              reject(e);
            }
          }, updateDelay);
        })
      );
    }

    return this.pendingUpdates.get(uri);
  }

  async requestCacheEntryUpdate(document: vscode.TextDocument) {
    const affectedDocuments = this.getAffectedDocuments(document);
    for (const affected of affectedDocuments.values()) {
      this.enqueueCacheUpdate(affected);
    }
    this.clearStaleCacheEntries();
  }

  clearStaleCacheEntries(): void {
    const MAX_CACHE_ENTRY_AGE = 3000;
    const now = Date.now();
    for (const uri of Object.keys(this.cache)) {
      const lastUpdate = this.lastUpdate[uri];
      const pending = this.pendingUpdates[uri];
      if (!pending && lastUpdate && now - lastUpdate > MAX_CACHE_ENTRY_AGE) {
        delete this.cache[uri];
        delete this.lastUpdate[uri];
        delete this.pendingUpdates[uri];
      }
    }
  }

  async getCacheEntry(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();

    if (this.cache[uri]) {
      return this.cache[uri];
    } else if (this.pendingUpdates[uri]) {
      return this.pendingUpdates[uri];
    }

    const entry = await this.updateCacheEntry(document);
    this.lastUpdate[uri] = Date.now();

    return entry;
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

  private clearBundlerErrors(documents) {
    for (const uri of documents.keys()) {
      this.diagnostics.delete(vscode.Uri.parse(uri));
    }
  }
}
