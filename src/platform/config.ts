import * as vscode from "vscode";
import * as yaml from "js-yaml";

import { dirnameUri, exists, existsDir, relative } from "../fs-util";
import { TextDecoder, TextEncoder } from "node:util";

export type ConfigFile = {
  apis: Record<string, ApiConfig>;
};

export type ApiConfig = {
  alias: string;
  tags?: string[];
};

export async function getApiConfig(openapiUri: vscode.Uri): Promise<ApiConfig | undefined> {
  const config = await getConfig(openapiUri);
  if (config === undefined) {
    return undefined;
  }
  const rootUri = await getRootUri(openapiUri);
  const apiPath = getApiRelativePath(rootUri, openapiUri);
  return config.apis[apiPath];
}

export async function makeApiConfig(openapiUri: vscode.Uri, title: string): Promise<ApiConfig> {
  const rootUri = await getRootUri(openapiUri);
  const config = (await getConfig(openapiUri)) || createDefaultConfig();
  const path = getApiRelativePath(rootUri, openapiUri);

  if (config.apis[path] === undefined) {
    const aliases = Object.values(config.apis).map((api) => api.alias);
    const uniqueAlias = getUniqueAlias(aliases, convertTitleToAlias(title));
    config.apis[path] = { alias: uniqueAlias, tags: [] };
    await writeConfig(rootUri, config);
  }

  return config.apis[path];
}

export async function saveApiConfig(openapiUri: vscode.Uri, apiConfig: ApiConfig) {
  const rootUri = await getRootUri(openapiUri);
  const config = (await getConfig(openapiUri)) || createDefaultConfig();
  const apiRelativePath = getApiRelativePath(rootUri, openapiUri);
  config.apis[apiRelativePath] = apiConfig;
  await writeConfig(rootUri, config);
}

export async function getConfig(openapiUri: vscode.Uri): Promise<ConfigFile | undefined> {
  const rootUri = await getRootUri(openapiUri);
  if (!(await exists(getConfigUri(rootUri)))) {
    return undefined;
  }
  return await readConfig(rootUri);
}

function createDefaultConfig(): ConfigFile {
  return { apis: {} };
}

function getApiRelativePath(rootUri: vscode.Uri, openapiUri: vscode.Uri): string {
  return relative(rootUri, openapiUri);
}

export async function getScanconfUri(openapiUri: vscode.Uri): Promise<vscode.Uri | undefined> {
  const rootUri = await getRootUri(openapiUri);
  const config = await getApiConfig(openapiUri);
  if (config === undefined) {
    return undefined;
  }

  const scanDirectoryAliasUri = vscode.Uri.joinPath(rootUri, ".42c", "scan", config.alias);
  const scanconfUri = vscode.Uri.joinPath(scanDirectoryAliasUri, "scanconf.json");
  if (!(await existsDir(scanDirectoryAliasUri)) || !(await exists(scanconfUri))) {
    return undefined;
  }

  return scanconfUri;
}

export async function makeScanconfUri(openapiUri: vscode.Uri, title: string): Promise<vscode.Uri> {
  const rootUri = await getRootUri(openapiUri);
  // if config doesn't exist, makeApiConfig will create it
  const config = (await getApiConfig(openapiUri)) || (await makeApiConfig(openapiUri, title));
  const scanDirectoryAliasUri = vscode.Uri.joinPath(rootUri, ".42c", "scan", config.alias);
  if (!(await existsDir(scanDirectoryAliasUri))) {
    await vscode.workspace.fs.createDirectory(scanDirectoryAliasUri);
  }
  return vscode.Uri.joinPath(scanDirectoryAliasUri, "scanconf.json");
}

function getConfigUri(rootUri: vscode.Uri) {
  return vscode.Uri.joinPath(getConfigDirUri(rootUri), "conf.yaml");
}

function getConfigDirUri(rootUri: vscode.Uri) {
  return vscode.Uri.joinPath(rootUri, ".42c");
}

async function getRootUri(oasUri: vscode.Uri): Promise<vscode.Uri> {
  // find root URI for the OAS file
  // in order of preference: a parent directory with a .git folder, workspace folder, or OAS dirname()

  const gitRoot = await getGitRoot(oasUri);
  if (gitRoot !== undefined) {
    return gitRoot;
  }

  const workspaceRoot = getWorkspaceFolder(oasUri);
  if (workspaceRoot !== undefined) {
    return workspaceRoot.uri;
  }

  return dirnameUri(oasUri);
}

async function readConfig(rootUri: vscode.Uri): Promise<ConfigFile> {
  // TODO check schema
  const content = await vscode.workspace.fs.readFile(getConfigUri(rootUri));
  const config = new TextDecoder("utf-8").decode(content);
  return yaml.load(config) as ConfigFile;
}

async function writeConfig(rootUri: vscode.Uri, config: ConfigFile) {
  const configDirUri = getConfigDirUri(rootUri);
  if (!(await existsDir(configDirUri))) {
    await vscode.workspace.fs.createDirectory(configDirUri);
  }
  const configUri = getConfigUri(rootUri);
  const text = yaml.dump(config);
  await vscode.workspace.fs.writeFile(configUri, new TextEncoder().encode(text));
}

function convertTitleToAlias(title: string) {
  const MAX_ALIAS_LENGTH = 32;
  return title
    .replace(/[^A-Za-z0-9_\\-\\.]/g, "-")
    .toLowerCase()
    .split(/-+/)
    .filter((segment) => segment !== "")
    .join("-")
    .substring(0, MAX_ALIAS_LENGTH);
}

function getUniqueAlias(aliases: string[], newAlias: string): string {
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

async function getGitRoot(oasUri: vscode.Uri): Promise<vscode.Uri | undefined> {
  for (let dir = dirnameUri(oasUri); dir.path !== "/"; dir = dirnameUri(dir)) {
    const gitDirUri = vscode.Uri.joinPath(dir, ".git");
    if (await existsDir(gitDirUri)) {
      return dir;
    }
  }
  return undefined;
}
