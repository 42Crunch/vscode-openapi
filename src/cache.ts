/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { relative, extname } from "path";
import * as vscode from "vscode";
import { CacheEntry } from "./types";
import { OpenApiVersion } from "./types";
import { parseToAst, parseToObject } from "./parsers";
import { ParserOptions } from "./parser-options";
import { bundle } from "./bundler";
import { parseJsonPointer, joinJsonPointer } from "./pointer";

export class Cache {
  private cache: { [uri: string]: CacheEntry } = {};
  private parserOptions: ParserOptions;
  private _didChange = new vscode.EventEmitter<CacheEntry>();
  private _didActiveDocumentChange = new vscode.EventEmitter<CacheEntry>();
  private diagnostics = vscode.languages.createDiagnosticCollection("openapi");

  constructor(parserOptions: ParserOptions) {
    this.parserOptions = parserOptions;
  }

  get onDidChange(): vscode.Event<CacheEntry> {
    return this._didChange.event;
  }

  get onDidActiveDocumentChange(): vscode.Event<CacheEntry> {
    return this._didActiveDocumentChange.event;
  }

  async onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    const activeEditor = vscode.window.activeTextEditor;
    // check change events for the active editor only
    // triggers both events, in future we might update cache
    // not only for the currently active editor, in this case
    // _didChange and _didActiveDocumentChange might fire at a different
    // times
    if (activeEditor && activeEditor.document.uri.toString() === event.document.uri.toString()) {
      const entry = await this.updateCacheAsync(event.document);
      this._didChange.fire(entry);
      this._didActiveDocumentChange.fire(entry);
    }
  }

  // TODO track on close events and clear non-json documents

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    // TODO don't re-parse if we've got up-to-date contents in the cache
    if (editor) {
      const entry = await this.updateCacheAsync(editor.document);
      this._didChange.fire(entry);
      this._didActiveDocumentChange.fire(entry);
    }
  }

  async getEntryForDocument(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();
    if (this.cache[uri]) {
      return this.cache[uri];
    }

    const entry = this.updateCacheSync(document);
    await this.updateCacheSync(document);
    return entry;
  }

  getEntryForDocumentSync(document: vscode.TextDocument): CacheEntry {
    const uri = document.uri.toString();
    if (this.cache[uri]) {
      return this.cache[uri];
    }
    return this.updateCacheSync(document);
  }

  private updateCacheSync(document: vscode.TextDocument): CacheEntry {
    const entry = this.getOrCreateEntry(document);

    const [version, node, errors] = parseToAst(document, this.parserOptions);

    entry.version = version;
    entry.astRoot = node;
    entry.errors = errors;

    if (!errors) {
      entry.lastGoodAstRoot = node;
      entry.parsed = parseToObject(document, this.parserOptions);
    } else {
      entry.parsed = null;
    }

    return entry;
  }

  private async updateCacheAsync(document: vscode.TextDocument): Promise<CacheEntry> {
    const entry = this.updateCacheSync(document);

    if (!entry.errors) {
      try {
        const [bundled, mapping] = await bundle(document, this);
        entry.bundled = bundled;
        entry.bundledMapping = mapping;
      } catch (errors) {
        this.displayBundlerErrors(document.uri, errors);
        entry.bundled = null;
        entry.bundledUris = null;
        entry.bundledMapping = null;
      }
    } else {
      entry.bundled = null;
      entry.bundledUris = null;
      entry.bundledMapping = null;
    }
    return entry;
  }

  private getOrCreateEntry(document: vscode.TextDocument): CacheEntry {
    const _uri = document.uri.toString();
    if (this.cache[_uri]) {
      return this.cache[_uri];
    }

    const entry = {
      document,
      uri: document.uri,
      version: OpenApiVersion.Unknown,
      astRoot: null,
      lastGoodAstRoot: null,
      parsed: null,
      errors: null,
      bundled: null,
      bundledErorrs: null,
      bundledUris: null,
      bundledMapping: null,
    };

    this.cache[_uri] = entry;
    return entry;
  }

  private displayBundlerErrors(documentUri: vscode.Uri, errors: any) {
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
      resolverErrors[uri.toString()].push({
        message: `Failed to resolve reference: ${error.message}`,
        path: error.path,
      });
    }

    for (const key of Object.keys(resolverErrors)) {
      const uri = vscode.Uri.parse(key);
      const entry = this.cache[uri.toString()];
      if (!entry) {
        continue;
      }

      const messages = [];
      for (const { path, message } of resolverErrors[key]) {
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
        messages.push({
          message,
          range,
          severity: vscode.DiagnosticSeverity.Error,
        });
      }
      this.diagnostics.set(uri, messages);
    }
  }
}
