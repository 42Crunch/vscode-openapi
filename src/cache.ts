/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { BundleResult, BundlingError } from "./types";
import { OpenApiVersion } from "./types";
import { parseToAst, parseToObject } from "./parsers";
import { ParserOptions } from "./parser-options";
import { bundle } from "./bundler";
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
      for (const entry of this.cache.values()) {
        if (entry.bundle) {
          this.requestCacheEntryUpdate(entry.document, true);
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
    }
  }

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    if (!editor?.document || vscode.languages.match(this.selector, editor.document) === 0) {
      this._didActiveDocumentChange.fire(editor?.document);
    } else {
      await this.requestCacheEntryUpdate(editor.document);
      this._didActiveDocumentChange.fire(editor.document);
    }
  }

  getDocumentVersion(document: vscode.TextDocument): OpenApiVersion {
    if (document) {
      const entry = this.cache.get(document.uri.toString());
      return entry ? entry.version : OpenApiVersion.Unknown;
    }
    return OpenApiVersion.Unknown;
  }

  getDocumentVersionByDocumentUri(uri: string): OpenApiVersion {
    const entry = this.cache.get(uri);
    return entry ? entry.version : OpenApiVersion.Unknown;
  }

  getDocumentAstByDocumentUri(uri: string): Node | undefined {
    const entry = this.cache.get(uri);
    if (entry && !entry.errors) {
      return entry.astRoot;
    }
  }

  async getDocumentAst(document: vscode.TextDocument): Promise<Node | undefined> {
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

  async getDocumentBundle(document: vscode.TextDocument): Promise<BundleResult | undefined> {
    const entry = await this.getCacheEntry(document);
    return entry.bundle;
  }

  private async getCacheEntry(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();

    if (this.cache.has(uri)) {
      return this.cache.get(uri);
    } else if (this.pendingUpdates.has(uri)) {
      return this.pendingUpdates.get(uri);
    }

    const entry = this.buildCacheEntry(document, null);
    this.cache.set(uri, entry);
    this.lastUpdate.set(uri, Date.now());

    return entry;
  }

  private async requestCacheEntryUpdate(document: vscode.TextDocument, force: boolean = false) {
    const affectedDocuments = this.getAffectedDocuments(document, force);
    if (affectedDocuments.size === 0) {
      return;
    }

    const bundled: BundleResult[] = [];
    for (const affected of affectedDocuments.values()) {
      const result = await this.enqueueCacheUpdate(affected);
      if (result.bundle) {
        bundled.push(result.bundle);
      }
    }

    // collect bundling falures and successes aggregated
    // by document URI
    const failures = new Map<string, BundlingError[]>();
    const successes = new Set<string>();
    for (const bundle of bundled) {
      if ("errors" in bundle) {
        for (const [uri, errors] of bundle.errors.entries()) {
          failures.set(uri, failures.has(uri) ? [...failures.get(uri), ...errors] : errors);
        }
      } else {
        for (const uri of bundle.documents.keys()) {
          successes.add(uri);
        }
      }
    }

    // for all successfully bundled documents, clear errors
    for (const uri of successes.values()) {
      this.diagnostics.delete(vscode.Uri.parse(uri));
    }

    this.showBundlerErrors(failures);
    this.clearStaleCacheEntries();
  }

  // returns a list of documents for which the cache needs to be updated
  // if this particular document changes
  private getAffectedDocuments(document: vscode.TextDocument, force): Set<vscode.TextDocument> {
    const affected = new Set<vscode.TextDocument>();

    // document needs to be updated if it's not in cache
    // or the documentVersion of cache entry is different to that of
    // the document
    const entry = this.cache.get(document.uri.toString());
    if (!entry || entry.documentVersion !== document.version || force) {
      affected.add(document);
    }

    // also check all cache entries which have bundles and see if
    // document belongs to a bundle, if so re-bundle the relevant
    // cache entry
    for (const entry of this.cache.values()) {
      if (entry.bundle) {
        const bundle = entry.bundle;

        if ("errors" in bundle) {
          // always re-bundle ones with errors
          affected.add(entry.document);
        } else {
          const bundleDocument = bundle.documents.get(document.uri.toString());
          if (bundleDocument && bundleDocument.version !== document.version) {
            affected.add(entry.document);
          }
        }
      }
    }
    return affected;
  }

  private getUpdateDelay(uri: string): number {
    const MAX_UPDATE = 1000; // update no more ofent than

    // zero delay if never been updated before
    if (!this.lastUpdate.has(uri)) {
      return 0;
    }

    const now = Date.now();
    const sinceLastUpdate = now - this.lastUpdate.get(uri);

    return MAX_UPDATE > sinceLastUpdate ? MAX_UPDATE - sinceLastUpdate : 0;
  }

  private enqueueCacheUpdate(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();

    // enqueue the update if not already pending
    if (!this.pendingUpdates.has(uri)) {
      const updateDelay = this.getUpdateDelay(uri);
      this.pendingUpdates.set(
        uri,
        new Promise<CacheEntry>((resolve, reject) => {
          setTimeout(async () => {
            try {
              // build entry
              const entry = this.buildCacheEntry(document, this.cache.get(document.uri.toString()));

              if (!entry.errors) {
                entry.bundle = await this.bundleEntry(document, entry);
              }

              // update cache structures
              this.cache.set(uri, entry);
              this.lastUpdate.set(uri, Date.now());
              this.pendingUpdates.delete(uri);

              // send events
              this._didChange.fire(document);

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

  private buildCacheEntry(document: vscode.TextDocument, previous: CacheEntry): CacheEntry {
    const [version, node, errors] = parseToAst(document, this.parserOptions);

    // produce value only if no errors encountered
    let lastGoodAstRoot = previous?.lastGoodAstRoot;
    if (!errors) {
      lastGoodAstRoot = node;
    }

    let value = null;
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

  private async bundleEntry(
    document: vscode.TextDocument,
    entry: CacheEntry
  ): Promise<BundleResult> {
    const approvedHosts = configuration.get<string[]>("approvedHostnames");
    const result = await bundle(
      document,
      entry.version,
      entry.parsed,
      this,
      approvedHosts,
      this.externalRefProvider
    );

    return result;
  }

  private clearStaleCacheEntries(): void {
    const MAX_CACHE_ENTRY_AGE = 300000;
    const now = Date.now();
    for (const uri of this.cache.keys()) {
      const lastUpdate = this.lastUpdate.get(uri);
      const pending = this.pendingUpdates.get(uri);
      if (!pending && lastUpdate && now - lastUpdate > MAX_CACHE_ENTRY_AGE) {
        this.cache.delete(uri);
        this.lastUpdate.delete(uri);
        this.pendingUpdates.delete(uri);
      }
    }
  }

  private showBundlerErrors(errors: Map<string, BundlingError[]>) {
    for (const uri of errors.keys()) {
      const entry = this.cache.get(uri);
      if (!entry) {
        continue;
      }

      const messages = new Map<string, vscode.Diagnostic>();

      for (const error of errors.get(uri)) {
        const node = entry.astRoot.find(error.pointer);
        if (node) {
          const [start] = node.getRange();
          const position = entry.document.positionAt(start);
          const line = entry.document.lineAt(position.line);
          const range = new vscode.Range(
            new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
            new vscode.Position(position.line, line.range.end.character)
          );
          const message = error.message ? error.message : "Failed to resolve $ref";

          const additionalProperties: any = {};

          if (error.rejectedHost) {
            additionalProperties.rejectedHost = error.rejectedHost;
            additionalProperties.code = "rejected";
          }

          const existing = messages.get(error.pointer);
          // allow only one message per pointer, allow EMISSINGPOINTER errors to be overriden
          // by other error types
          if (!existing || existing["resolverCode"] === "EMISSINGPOINTER") {
            messages.set(error.pointer, {
              resolverCode: error.code,
              message,
              range,
              severity: vscode.DiagnosticSeverity.Error,
              ...additionalProperties,
            });
          }
        }
      }

      this.diagnostics.set(vscode.Uri.parse(uri), [...messages.values()]);
    }
  }
}
