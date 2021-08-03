/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { Node } from "@xliic/openapi-ast-node";
import { ExternalRefDocumentProvider } from "./external-refs";
import { ParserOptions } from "./parser-options";
import { BundleResult, BundlingError, OpenApiVersion } from "./types";
import { parseToAst } from "./parsers";
import { configuration } from "./configuration";
import { bundle } from "./bundler";
import { parse } from '@xliic/preserving-json-yaml-parser';

interface ParsedDocument {
  documentVersion: number;
  openApiVersion: OpenApiVersion;
  lastGoodAstRoot?: Node;
  astRoot?: Node;
  parsed?: any;
  errors: vscode.Diagnostic[];
}

interface BundledDocument {
  document: vscode.TextDocument;
  bundle: BundleResult;
}

interface MaybeBundledDocument {
  document: vscode.TextDocument;
  bundle?: BundleResult;
}

class Throttle {
  private lastUpdate = new Map<string, number>();

  constructor(private limit: number) {}

  throttle(key: string, delay: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.lastUpdate.set(key, Date.now());
        resolve();
      }, delay);
    });
  }

  delay(key: string): number {
    if (this.lastUpdate.has(key)) {
      return 0;
    }

    const now = Date.now();
    const elapsed = now - this.lastUpdate.get(key)!;
    return this.limit > elapsed ? this.limit - elapsed : 0;
  }
}

class ExpiringCache<K, T> implements vscode.Disposable {
  private expireTimer: NodeJS.Timer;
  private entries = new Map<K, { timestamp: number; value: T }>();

  constructor(private interval: number, private maxAge: number) {
    this.expireTimer = setInterval(() => this.expire(), this.interval);
  }

  get(key: K): T | undefined {
    const entry = this.entries.get(key);
    if (entry) {
      entry.timestamp = Date.now();
      return entry.value;
    }
  }

  set(key: K, value: T): void {
    this.entries.set(key, {
      timestamp: Date.now(),
      value,
    });
  }

  delete(key: K): boolean {
    return this.entries.delete(key);
  }

  values(): T[] {
    return Array.from(this.entries.values(), (entry) => entry.value);
  }

  private expire(): void {
    const now = Date.now();
    for (const [key, value] of this.entries) {
      if (now - value.timestamp > this.maxAge) {
        this.entries.delete(key);
      }
    }
  }

  dispose() {
    clearInterval(this.expireTimer);
  }
}

class ParsedDocumentCache implements vscode.Disposable {
  private cache: ExpiringCache<string, ParsedDocument>;

  constructor(interval: number, maxAge: number, private parserOptions: ParserOptions) {
    this.cache = new ExpiringCache<string, ParsedDocument>(interval, maxAge);
  }

  get(document: vscode.TextDocument): ParsedDocument {
    const cached = this.cache.get(document.uri.toString());
    if (cached && cached.documentVersion === document.version) {
      return cached;
    }

    const parsed = this.parse(document, cached);
    this.cache.set(document.uri.toString(), parsed);
    return parsed;
  }

  dispose() {
    this.cache.dispose();
  }

  private parse(document: vscode.TextDocument, previous: ParsedDocument | undefined) {
    const [openApiVersion, astRoot, errors] = parseToAst(document, this.parserOptions);

    // set lastGoodAstRoot only if no errors found, in case of errors try to reuse previous value
    const lastGoodAstRoot = errors ? previous?.lastGoodAstRoot : astRoot;

    // parse if no errors
    const parsed = !errors ? parse(document.getText(), astRoot) : undefined;

    return {
      openApiVersion,
      documentVersion: document.version,
      astRoot,
      lastGoodAstRoot,
      errors,
      parsed,
    };
  }
}

class BundledDocumentCache implements vscode.Disposable {
  private cache: ExpiringCache<string, BundledDocument>;

  constructor(
    interval: number,
    maxAge: number,
    private documentParser: (document: vscode.TextDocument) => ParsedDocument,
    private externalRefProvider: ExternalRefDocumentProvider
  ) {
    this.cache = new ExpiringCache<string, BundledDocument>(interval, maxAge);
  }

  async get(document: vscode.TextDocument): Promise<BundleResult | undefined> {
    const cached = this.cache.get(document.uri.toString());
    if (cached) {
      return cached.bundle;
    }
    const bundle = await this.bundle(document);
    if (bundle) {
      this.cache.set(document.uri.toString(), {
        document,
        bundle,
      });
    }
    return bundle;
  }

  values(): BundledDocument[] {
    return this.cache.values();
  }

  // given the 'document' update all known bundles which this
  // document is a part of
  async update(document: vscode.TextDocument): Promise<MaybeBundledDocument[]> {
    const affected = this.getAffectedDocuments(document);
    const results = [];
    for (const document of affected) {
      const bundle = await this.bundle(document);
      if (bundle) {
        this.cache.set(document.uri.toString(), { document, bundle });
      } else {
        // failed to bundle, remove old bundle from the cache
        this.cache.delete(document.uri.toString());
      }
      results.push({ document, bundle });
    }
    return results;
  }

  private async bundle(document: vscode.TextDocument): Promise<BundleResult | undefined> {
    const approvedHosts = configuration.get<string[]>("approvedHostnames");
    const parsed = this.documentParser(document);
    if (!parsed.errors) {
      return await bundle(
        document,
        parsed.openApiVersion,
        parsed.parsed,
        (document: vscode.TextDocument) => this.documentParser(document).parsed,
        approvedHosts,
        this.externalRefProvider
      );
    }
  }

  private getAffectedDocuments(document: vscode.TextDocument): Set<vscode.TextDocument> {
    const affected = new Set<vscode.TextDocument>([document]);
    // check all cache entries which have bundles and see if
    // document belongs to a bundle, if so re-bundle the relevant
    // cache entry
    for (const entry of this.cache.values()) {
      if (entry.bundle) {
        if ("errors" in entry.bundle || entry.bundle.documents.has(document)) {
          // rebundle ones with errors
          // rebundle where document is a sub-document of a bundle
          affected.add(entry.document);
        }
      }
    }
    return affected;
  }

  dispose() {
    this.cache.dispose();
  }
}

export class Cache implements vscode.Disposable {
  private bundledDocuments: BundledDocumentCache;
  private parsedDocuments: ParsedDocumentCache;
  private throttle: Throttle;
  private _didChange = new vscode.EventEmitter<vscode.TextDocument>();
  private _didActiveDocumentChange = new vscode.EventEmitter<vscode.TextDocument | undefined>();
  private diagnostics = vscode.languages.createDiagnosticCollection("openapi-bundler");

  constructor(
    parserOptions: ParserOptions,
    private documentSelector: vscode.DocumentSelector,
    private externalRefProvider: ExternalRefDocumentProvider
  ) {
    const MAX_UPDATE_FREQUENCY = 1000, // re-bundle no more often than 1 time per second
      MAX_CACHE_ENTRY_AGE = 30000, // keep data in caches for 30 seconds max
      CACHE_CLEANUP_INTERVAL = 10000; // clean cache every 10 seconds

    this.throttle = new Throttle(MAX_UPDATE_FREQUENCY);

    this.parsedDocuments = new ParsedDocumentCache(
      CACHE_CLEANUP_INTERVAL,
      MAX_CACHE_ENTRY_AGE,
      parserOptions
    );

    this.bundledDocuments = new BundledDocumentCache(
      CACHE_CLEANUP_INTERVAL,
      MAX_CACHE_ENTRY_AGE,
      (document: vscode.TextDocument) => this.parsedDocuments.get(document),
      externalRefProvider
    );

    configuration.onDidChange(async () => {
      // when configuration is updated, re-bundle all bundled cache entries
      for (const entry of this.bundledDocuments.values()) {
        this.onChange(entry.document);
      }
    });
  }

  get onDidChange(): vscode.Event<vscode.TextDocument> {
    return this._didChange.event;
  }

  get onDidActiveDocumentChange(): vscode.Event<vscode.TextDocument | undefined> {
    return this._didActiveDocumentChange.event;
  }

  getExternalRefDocumentProvider(): ExternalRefDocumentProvider {
    return this.externalRefProvider;
  }

  getDocumentVersion(document: vscode.TextDocument): OpenApiVersion {
    return document ? this.parsedDocuments.get(document).openApiVersion : OpenApiVersion.Unknown;
  }

  getDocumentAst(document: vscode.TextDocument): Node | undefined {
    return this.parsedDocuments.get(document).astRoot;
  }

  getLastGoodDocumentAst(document: vscode.TextDocument): Node | undefined {
    return this.parsedDocuments.get(document).lastGoodAstRoot;
  }

  async getDocumentBundle(document: vscode.TextDocument): Promise<BundleResult | undefined> {
    return this.bundledDocuments.get(document);
  }

  dispose() {
    this.parsedDocuments.dispose();
    this.bundledDocuments.dispose();
  }

  async onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    if (vscode.languages.match(this.documentSelector, event.document) === 0) {
      this._didChange.fire(event.document);
    } else {
      this.onChange(event.document);
    }
  }

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    if (!editor?.document || vscode.languages.match(this.documentSelector, editor.document) === 0) {
      this._didActiveDocumentChange.fire(editor?.document);
    } else {
      this.onChange(editor.document);
    }
  }

  private async onChange(document: vscode.TextDocument): Promise<void> {
    const delay = this.throttle.delay(document.uri.toString());
    if (delay > 0) {
      // going to throttle, the document must be already in cache
      // so emit onActiveEditorChanged before throttling
      if (vscode.window?.activeTextEditor?.document === document) {
        this._didActiveDocumentChange.fire(document);
      }
    }
    await this.throttle.throttle(document.uri.toString(), delay);
    const updated = await this.bundledDocuments.update(document);
    const aggregated = this.aggregateErrors(updated);
    this.showErrors(aggregated.successes, aggregated.failures, aggregated.errors);
    for (const { document } of updated) {
      this._didChange.fire(document);
      if (vscode.window?.activeTextEditor?.document === document) {
        this._didActiveDocumentChange.fire(document);
      }
    }
  }

  private aggregateErrors(results: MaybeBundledDocument[]) {
    const bundlingErrors = new Map<vscode.TextDocument, BundlingError[]>();
    const bundlingSuccesses = new Set<vscode.TextDocument>();
    const bundlingFailures = new Set<vscode.TextDocument>();

    for (const { document, bundle } of results) {
      if (!bundle) {
        // failed to bundle, must be parsing errors in the relevant document
        bundlingFailures.add(document);
      } else if ("errors" in bundle) {
        // produced bundling result, but encountered errors when bundling
        for (const [uri, errors] of bundle.errors.entries()) {
          bundlingErrors.set(
            document,
            bundlingErrors.has(document) ? [...bundlingErrors.get(document)!, ...errors] : errors
          );
        }
      } else {
        // successfully bundled
        bundlingSuccesses.add(document);
        for (const document of bundle.documents.values()) {
          bundlingSuccesses.add(document);
        }
      }
    }

    return { failures: bundlingFailures, errors: bundlingErrors, successes: bundlingSuccesses };
  }

  private showErrors(
    bundlingSuccesses: Set<vscode.TextDocument>,
    bundlingFailures: Set<vscode.TextDocument>,
    bundlingErrors: Map<vscode.TextDocument, BundlingError[]>
  ) {
    // clear errors for successfully bundled documents
    for (const document of bundlingSuccesses.values()) {
      this.diagnostics.delete(document.uri);
    }

    // clear errors for documents that failed to bundle
    // to clean previous bundling errors
    for (const document of bundlingFailures.values()) {
      this.diagnostics.delete(document.uri);
    }

    for (const [document, errors] of bundlingErrors.entries()) {
      const messages = new Map<string, vscode.Diagnostic>();

      for (const error of errors) {
        const parsed = this.parsedDocuments.get(document);
        if (!parsed.astRoot) {
          continue;
        }
        const node = parsed.astRoot.find(error.pointer);
        if (node) {
          const [start] = node.getRange();
          const position = document.positionAt(start);
          const line = document.lineAt(position.line);
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

          const existing: any = messages.get(error.pointer);
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

      this.diagnostics.set(document.uri, [...messages.values()]);
    }
  }
}
