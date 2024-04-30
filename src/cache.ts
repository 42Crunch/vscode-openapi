/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";
import { ExternalRefDocumentProvider } from "./external-refs";
import { ParserOptions } from "./parser-options";
import { BundleResult, BundlingError, OpenApiVersion } from "./types";
import { parseDocument } from "./parsers";
import { configuration } from "./configuration";
import { bundle } from "./bundler";
import { find, findLocationForJsonPointer, Parsed } from "@xliic/preserving-json-yaml-parser";

interface ParsedDocument {
  documentVersion: number;
  openApiVersion: OpenApiVersion;
  lastGoodParsed?: Parsed;
  parsed?: Parsed;
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
  private tasks = new Map<string, NodeJS.Timeout>();

  constructor(private delay: number) {}

  throttle(key: string, callback: () => void): void {
    const existing = this.tasks.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      this.tasks.delete(key);
      callback();
    }, this.delay);

    this.tasks.set(key, timeout);
  }
}

class ExpiringCache<K, T> implements vscode.Disposable {
  private expireTimer: NodeJS.Timeout;
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
  private diagnostics = vscode.languages.createDiagnosticCollection("openapi-parser");

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

  private showErrors(
    document: vscode.TextDocument,
    version: OpenApiVersion,
    errors: vscode.Diagnostic[]
  ) {
    const expectedMessages: any = {
      DuplicateKey: "Duplicate object key",
      InvalidCommentToken: "Comment is not permitted",
    };

    const additionalMessages = ["JS-YAML: Using tabs can lead to unpredictable results"];

    // do not show errors for non-openapi documents
    if (errors.length === 0 || version === OpenApiVersion.Unknown) {
      this.diagnostics.delete(document.uri);
    } else {
      // only display selected set of error messages, other parsing
      // errors will be shown by vs-code and we don't want duplicates
      const filtered = errors
        .map((error) => {
          if (error.message in expectedMessages) {
            return { ...error, message: expectedMessages[error.message] };
          } else {
            for (const message of additionalMessages) {
              if (error.message.startsWith(message)) {
                return { ...error, message };
              }
            }
          }
        })
        .filter((error) => error !== undefined) as vscode.Diagnostic[];

      this.diagnostics.set(document.uri, filtered);
    }
  }

  private parse(
    document: vscode.TextDocument,
    previous: ParsedDocument | undefined
  ): ParsedDocument {
    const [openApiVersion, parsed, errors] = parseDocument(document, this.parserOptions);

    // set lastGoodParsed only if no errors found, in case of errors try to reuse previous value
    const lastGoodParsed = errors.length == 0 ? parsed : previous?.lastGoodParsed;

    this.showErrors(document, openApiVersion, errors);

    return {
      openApiVersion,
      documentVersion: document.version,
      lastGoodParsed,
      errors,
      parsed: errors.length == 0 ? parsed : undefined,
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

  async get(
    document: vscode.TextDocument,
    options?: { rebundle?: boolean }
  ): Promise<BundleResult | undefined> {
    const cached = this.cache.get(document.uri.toString());
    if (cached && !options?.rebundle) {
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
    const rebundle = this.getAffectedDocuments(document);
    // check if this document is an OpenAPI document and must be re-bundled itself
    const parsed = this.documentParser(document);
    if (parsed.openApiVersion !== OpenApiVersion.Unknown) {
      rebundle.add(document);
    }
    const results = [];
    for (const document of rebundle) {
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
    if (parsed.errors.length === 0 && parsed.parsed) {
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
    const affected = new Set<vscode.TextDocument>();
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

  getParsedDocument(document: vscode.TextDocument): Parsed | undefined {
    return this.parsedDocuments.get(document).parsed;
  }

  getLastGoodParsedDocument(document: vscode.TextDocument): Parsed | undefined {
    return this.parsedDocuments.get(document).lastGoodParsed;
  }

  async getDocumentBundle(
    document: vscode.TextDocument,
    options?: { rebundle?: boolean }
  ): Promise<BundleResult | undefined> {
    return this.bundledDocuments.get(document, options);
  }

  dispose() {
    this.parsedDocuments.dispose();
    this.bundledDocuments.dispose();
  }

  async onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    if (isSupportedDocument(this.documentSelector, event.document)) {
      this.onChange(event.document);
    } else {
      this._didChange.fire(event.document);
    }
  }

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    this._didActiveDocumentChange.fire(editor?.document);
    if (isSupportedDocument(this.documentSelector, editor?.document)) {
      this.onChange(editor!.document);
    }
  }

  private async onChange(document: vscode.TextDocument): Promise<void> {
    this.throttle.throttle(document.uri.toString(), async () => {
      const updated = await this.bundledDocuments.update(document);
      const aggregated = this.aggregateErrors(updated);
      this.showErrors(aggregated.successes, aggregated.failures, aggregated.errors);
      if (vscode.window?.activeTextEditor?.document === document) {
        this._didActiveDocumentChange.fire(document);
      }
      for (const { document } of updated) {
        this._didChange.fire(document);
      }
    });
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
          const documentWithError = getBundleDocumentByUri(bundle, uri);
          if (documentWithError) {
            bundlingErrors.set(
              documentWithError,
              bundlingErrors.has(documentWithError)
                ? [...bundlingErrors.get(documentWithError)!, ...errors]
                : errors
            );
          } else {
            console.error("Failed to find document containing the bundling error:", uri);
          }
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
        const entry = this.parsedDocuments.get(document);
        if (!entry.parsed) {
          continue;
        }
        const node = find(entry.parsed, error.pointer);
        const location = findLocationForJsonPointer(entry.parsed, error.pointer);
        if (node !== undefined && location !== undefined) {
          const position = document.positionAt(location.value.start);
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

function getBundleDocumentByUri(
  bundle: BundleResult,
  uri: string
): vscode.TextDocument | undefined {
  if (bundle.document.uri.toString() === uri) {
    return bundle.document;
  }

  for (const document of bundle.documents) {
    if (document.uri.toString() === uri) {
      return document;
    }
  }
}

function isSupportedDocument(
  selector: vscode.DocumentSelector,
  document?: vscode.TextDocument
): boolean {
  return (
    document !== undefined &&
    vscode.languages.match(selector, document) > 0 &&
    document.uri.scheme !== "git"
  );
}
