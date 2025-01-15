import * as vscode from "vscode";
import * as yaml from "js-yaml";

import { accessSync, constants, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirnameUri, relative } from "../../fs-util";
import { exists, existsDir } from "../../util/fs";

export type ConfigFile = {
  apis: Record<string, { alias: string }>;
};

export function getOrCreateScanconfUri(openapiUri: vscode.Uri, title: string): vscode.Uri {
  const rootUri = getRootUri(openapiUri);

  const configDirUri = vscode.Uri.joinPath(rootUri, ".42c");
  const configUri = vscode.Uri.joinPath(rootUri, ".42c", "conf.yaml");
  const relativeOasPath = relative(rootUri, openapiUri);
  const config = readConfigOrDefault(configUri);

  if (config.apis[relativeOasPath] === undefined) {
    const aliases = Object.values(config.apis).map((api) => api.alias);
    const uniqueAlias = getUniqueAlias(aliases, convertTitleToAlias(title));
    config.apis[relativeOasPath] = { alias: uniqueAlias };

    // make "config" dir
    if (!exists(configDirUri.fsPath)) {
      mkdirSync(configDirUri.fsPath);
    }

    // write config
    writeConfig(configUri, config);
  }

  const alias = config.apis[relativeOasPath].alias;

  // safeguard by making "scan" dir, "scan/<alias>" dirs in case these
  // have been removed
  const scanDirectoryUri = vscode.Uri.joinPath(rootUri, ".42c", "scan");
  if (!exists(scanDirectoryUri.fsPath)) {
    mkdirSync(scanDirectoryUri.fsPath);
  }

  const scanDirectoryAliasUri = vscode.Uri.joinPath(rootUri, ".42c", "scan", alias);
  if (!exists(scanDirectoryAliasUri.fsPath)) {
    mkdirSync(scanDirectoryAliasUri.fsPath);
  }

  return vscode.Uri.joinPath(rootUri, ".42c", "scan", alias, `scanconf.json`);
}

export function getScanconfUri(openapiUri: vscode.Uri): vscode.Uri | undefined {
  const rootUri = getRootUri(openapiUri);
  const configUri = vscode.Uri.joinPath(rootUri, ".42c", "conf.yaml");
  const relativeOasPath = relative(rootUri, openapiUri);
  const config = readConfigOrDefault(configUri);

  if (config.apis[relativeOasPath] === undefined) {
    return undefined;
  }

  const alias = config.apis[relativeOasPath].alias;

  if (alias === undefined) {
    return undefined;
  }

  return vscode.Uri.joinPath(rootUri, ".42c", "scan", alias, `scanconf.json`);
}

export function getOpenapiAlias(openapiUri: vscode.Uri): string | undefined {
  const rootUri = getRootUri(openapiUri);
  const configUri = vscode.Uri.joinPath(rootUri, ".42c", "conf.yaml");
  const relativeOasPath = relative(rootUri, openapiUri);
  const config = readConfigOrDefault(configUri);

  if (config.apis[relativeOasPath] === undefined) {
    return undefined;
  }

  return config.apis[relativeOasPath].alias;
}

export function getRootUri(oasUri: vscode.Uri): vscode.Uri {
  // find root URI for the OAS file
  // in order of preference: a parent directory with a .git folder, workspace folder, or OAS dirname()

  const gitRoot = getGitRoot(oasUri);
  if (gitRoot !== undefined) {
    return gitRoot;
  }

  const workspaceRoot = getWorkspaceFolder(oasUri);
  if (workspaceRoot !== undefined) {
    return workspaceRoot.uri;
  }

  return dirnameUri(oasUri);
}

export function readConfigOrDefault(configUri: vscode.Uri): ConfigFile {
  if (!exists(configUri.fsPath)) {
    return { apis: {} };
  }
  // TODO check schema
  return yaml.load(readFileSync(configUri.fsPath, "utf8")) as ConfigFile;
}

export function writeConfig(configUri: vscode.Uri, config: ConfigFile) {
  const text = yaml.dump(config);
  writeFileSync(configUri.fsPath, text, { encoding: "utf8" });
}

export function convertTitleToAlias(title: string) {
  const MAX_ALIAS_LENGTH = 32;
  return title
    .replace(/[^A-Za-z0-9_\\-\\.]/g, "-")
    .toLowerCase()
    .split(/-+/)
    .filter((segment) => segment !== "")
    .join("-")
    .substring(0, MAX_ALIAS_LENGTH);
}

export function getUniqueAlias(aliases: string[], newAlias: string): string {
  let uniqueAlias = newAlias;
  for (let count = 1; aliases.includes(uniqueAlias); count++) {
    uniqueAlias = `${newAlias}${count}`;
  }
  return uniqueAlias;
}

function getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      if (uri.fsPath.startsWith(folder.uri.fsPath)) {
        return folder;
      }
    }
  }
  return undefined;
}

export function getGitRoot(oasUri: vscode.Uri): vscode.Uri | undefined {
  for (let dir = dirnameUri(oasUri); dir.path !== "/"; dir = dirnameUri(dir)) {
    const gitDirUri = vscode.Uri.joinPath(dir, ".git");
    if (existsDir(gitDirUri.fsPath)) {
      return dir;
    }
  }
  return undefined;
}
