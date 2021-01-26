/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { extname } from "path";
import * as vscode from "vscode";
import { Bundle, CacheEntry } from "./types";
import { OpenApiVersion } from "./types";
import { parseToAst, parseToObject } from "./parsers";
import { ParserOptions } from "./parser-options";
import { bundle } from "./bundler";
import { joinJsonPointer } from "./pointer";
import { Node } from "./ast";

function walk(current: any, parent: any, path: string[], visitor: any) {
  for (const key of Object.keys(current)) {
    const value = current[key];
    if (typeof value === "object" && value !== null) {
      walk(value, current, [key, ...path], visitor);
    } else {
      visitor(parent, path, key, value);
    }
  }
}

function mode(arr) {
  return arr
    .sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length)
    .pop();
}

export class Cache {
  private cache: { [uri: string]: CacheEntry } = {};
  private parserOptions: ParserOptions;
  private _didChange = new vscode.EventEmitter<vscode.TextDocument>();
  private _didActiveDocumentChange = new vscode.EventEmitter<vscode.TextDocument>();

  private diagnostics = vscode.languages.createDiagnosticCollection("openapi-bundler");

  constructor(parserOptions: ParserOptions) {
    this.parserOptions = parserOptions;
  }

  get onDidChange(): vscode.Event<vscode.TextDocument> {
    return this._didChange.event;
  }

  get onDidActiveDocumentChange(): vscode.Event<vscode.TextDocument> {
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
      await this.updateCacheAsync(event.document);
      this._didChange.fire(event.document);
      this._didActiveDocumentChange.fire(event.document);
    }
  }

  // TODO track on close events and clear non-json documents

  async onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
    // TODO don't re-parse if we've got up-to-date contents in the cache
    if (editor) {
      await this.updateCacheAsync(editor.document);
      this._didChange.fire(editor.document);
      this._didActiveDocumentChange.fire(editor.document);
    }
  }

  getDocumentVersion(document: vscode.TextDocument): OpenApiVersion {
    this.updateCacheSync(document);
    const entry = this.getEntry(document);
    return entry ? entry.version : OpenApiVersion.Unknown;
  }

  getDocumentAst(document: vscode.TextDocument): Node {
    this.updateCacheSync(document);
    const entry = this.getEntry(document);
    if (entry) {
      return entry.astRoot;
    }
    return null;
  }

  getLastGoodDocumentAst(document: vscode.TextDocument): Node {
    this.updateCacheSync(document);
    const entry = this.getEntry(document);
    if (entry) {
      return entry.lastGoodAstRoot;
    }
    return null;
  }

  getDocumentValue(document: vscode.TextDocument): Promise<any> {
    this.updateCacheSync(document);
    const entry = this.getEntry(document);
    if (entry) {
      return entry.parsed;
    }
    return null;
  }

  async getDocumentBundle(document: vscode.TextDocument): Promise<Bundle> {
    await this.updateCacheAsync(document);
    const entry = this.getEntry(document);
    if (entry) {
      return entry.bundle;
    }
    return null;
  }

  // deprecated
  async getEntryForDocument(document: vscode.TextDocument): Promise<CacheEntry> {
    const uri = document.uri.toString();
    if (this.cache[uri]) {
      return this.cache[uri];
    }

    const entry = this.updateCacheSync(document);
    await this.updateCacheAsync(document);
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

    if (entry.version !== OpenApiVersion.Unknown && !entry.errors) {
      try {
        const bundled = await bundle(document, this);
        this.clearBundlerErrors(bundled.uris);
        entry.bundle = bundled;

        const hints = {};

        walk(bundled, null, [], (parent, path, key, value) => {
          // TODO check items for arrays
          if (path.length > 3 && path[1] === "properties") {
            const property = path[0];
            if (!hints[property]) {
              hints[property] = {};
            }
            if (!hints[property][key]) {
              hints[property][key] = [];
            }
            hints[property][key].push(value);
          }
        });

        // update hints replacing arrays of occurences of values
        // with most frequent value in the array
        for (const property of Object.keys(hints)) {
          for (const key of Object.keys(hints[property])) {
            hints[property][key] = mode(hints[property][key]);
          }
        }
        entry.propertyHints = hints;
      } catch (errors) {
        this.showBundlerErrors(document.uri, errors);
        entry.bundle = {
          errors,
          uris: null,
          mapping: null,
          value: null,
        };
      }
    } else {
      entry.bundle = null;
    }

    return entry;
  }

  private getEntry(document: vscode.TextDocument): CacheEntry {
    return this.cache[document.uri.toString()];
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
      bundle: null,
      propertyHints: null,
    };

    this.cache[_uri] = entry;
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

  private clearBundlerErrors(uris: any) {
    for (const uri of Object.keys(uris)) {
      this.diagnostics.delete(vscode.Uri.parse(uri));
    }
  }
}
