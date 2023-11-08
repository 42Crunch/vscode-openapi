import { parse, stringify } from "@xliic/preserving-json-yaml-parser";
import * as vscode from "vscode";

import { PlatformStore } from "./stores/platform-store";
import { confirmed, getApiId } from "./util";

class ApiFile implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;

  constructor() {
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
  }
}

export class PlatformFS implements vscode.FileSystemProvider {
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  constructor(private store: PlatformStore) {}

  watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
    return new vscode.Disposable(() => null);
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    return new ApiFile();
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const apiId = getApiId(uri)!;
    const api = await this.store.getApi(apiId);
    // parse and format json
    const buffer = Buffer.from(api.desc.specfile!, "base64");
    const [parsed, errors] = parse(buffer.toString("utf-8"), "json", {});
    if (errors.length > 0) {
      // failed to parse JSON, show it as is without formatting
      return buffer;
    }
    const text = stringify(parsed, 2);
    return Buffer.from(text, "utf-8");
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    const apiId = getApiId(uri)!;
    if (this.store.readonlyApis.has(apiId)) {
      throw vscode.FileSystemError.NoPermissions("Readonly file");
    }

    const proceed = await vscode.commands.executeCommand(
      "openapi.platform.dataDictionaryPreAuditBulkUpdateProperties",
      uri
    );

    if (proceed === false) {
      return;
    }

    if (!(await confirmed("Are you sure you want to update remote API?"))) {
      throw new Error("API Update has been cancelled.");
    }

    await vscode.window.withProgress<void>(
      {
        title: `Updating API ${apiId}`,
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      async () => {
        const found = vscode.workspace.textDocuments.filter(
          (document) => document.uri.toString() === uri.toString()
        );

        if (found.length !== 1) {
          throw new Error("Can't find TextDocument to save.");
        }

        const [parsed, errors] = parse(found[0].getText(), "json", {});
        if (errors.length > 0) {
          throw new Error("Document contains JSON parsing erorrs, please fix it before saving");
        }

        const text = stringify(parsed);

        await this.store.updateApi(apiId, Buffer.from(text));
      }
    );
  }

  delete(uri: vscode.Uri, options: { recursive: boolean }): void | Promise<void> {
    throw new Error("Method not implemented.");
  }

  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): void | Promise<void> {
    throw new Error("Method not implemented.");
  }

  readDirectory(
    uri: vscode.Uri
  ): [string, vscode.FileType][] | Promise<[string, vscode.FileType][]> {
    throw new Error("Method not implemented.");
  }

  createDirectory(uri: vscode.Uri): void | Promise<void> {
    throw new Error("Method not implemented.");
  }
}
