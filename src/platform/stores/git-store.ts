import * as fs from "fs";
import * as vscode from "vscode";
import picomatch from "picomatch";
import { Event, EventEmitter } from "vscode";
import path, { sep } from "path";
import { parse } from "@xliic/preserving-json-yaml-parser";
import { parserOptions } from "../../parser-options";

export interface Mapping {
  [k: string]: string;
}

export interface YamlTaskConfig {
  mapping?: Mapping;
}

type RootPathAndMapName = [string, string | undefined];

export const enum RefType {
  Head,
  RemoteHead,
  Tag,
}

export interface GitInfo {
  [uri: string]: GitRepoProps;
}

export interface GitRepoProps {
  branch: string;
  refType: RefType;
  rootPath: string;
  config: YamlTaskConfig;
}

export type GitChangeEvent = {
  enabled: boolean;
  state: "uninitialized" | "initialized";
  repository: boolean;
};

export class GitManager {
  private extension;
  private api: any;
  private info: GitInfo = {};
  private _onDidChange = new EventEmitter<GitChangeEvent>();

  constructor() {
    this.extension = vscode.extensions.getExtension("vscode.git")!.exports;
    this.api = this.extension.getAPI(1);
    this.api.onDidChangeState(this.onDidChangeState.bind(this));
    this.extension.onDidChangeEnablement(this.onDidChangeEnablement.bind(this));
  }

  get onDidChange(): Event<GitChangeEvent> {
    return this._onDidChange.event;
  }

  private async onDidChangeEnablement(state: boolean) {
    if (state === false) {
      this.info = {};
    }
    this._onDidChange.fire({
      enabled: this.extension.enabled,
      state: this.api.state,
      repository: false,
    });
  }

  private onDidChangeState(state: any) {
    if (state === "uninitialized") {
      this.info = {};
    }
    this._onDidChange.fire({
      enabled: this.extension.enabled,
      state: this.api.state,
      repository: false,
    });
  }

  private async onRepoDidChange() {
    this.info = this.calculateGitInfo();
    this._onDidChange.fire({
      enabled: this.extension.enabled,
      state: this.api.state,
      repository: true,
    });
  }

  getInfo(): GitInfo {
    if (this.enabled()) {
      if (Object.keys(this.info).length === 0) {
        this.info = this.calculateGitInfo();
      }
      return this.info;
    }
    return {};
  }

  refresh() {
    this.info = this.enabled() ? this.calculateGitInfo() : {};
  }

  private enabled(): boolean {
    return this.extension.enabled && this.api.state === "initialized";
  }

  private calculateGitInfo(): GitInfo {
    if (vscode.workspace.workspaceFolders) {
      const res: GitInfo = {};
      for (const folder of vscode.workspace.workspaceFolders) {
        for (const repository of this.api.repositories) {
          if (isDescendant(repository.rootUri.fsPath, folder.uri.fsPath)) {
            repository.state.onDidChange(this.onRepoDidChange.bind(this));
            const head = repository.state.HEAD;
            const upstream = head.upstream; // undefined for local branches
            if (upstream) {
              // Branches from the same remote have the same upstream.remote value
              const myRemotes = repository.state.remotes.filter(
                (r: any) => r.name === upstream.remote
              );
              if (myRemotes) {
                const branch = head.name;
                const refType = head.type;
                const rootPath = folder.uri.fsPath;
                const config = getConfig(branch, refType, rootPath);
                for (const remote of myRemotes) {
                  const url = getCleanRepoUrl(remote.fetchUrl);
                  res[url] = { branch, refType, rootPath, config };
                }
              }
            }
          }
        }
      }
      return res;
    }
    return {};
  }
}

function getConfig(branch: string, refType: RefType, rootPath: string): YamlTaskConfig {
  try {
    const config = fs.readFileSync(path.join(rootPath, "42c-conf.yaml"), {
      encoding: "utf8",
    });
    const [node, errors] = parse(config, "yaml", parserOptions);
    if (node && errors.length === 0) {
      const audit = (node as any)["audit"];
      if (refType === RefType.Head) {
        return findTaskConfig(branch, audit?.branches);
      } else if (refType === RefType.Tag) {
        return findTaskConfig(branch, audit?.tags);
      }
    }
  } catch (e) {}
  return {};
}

function isDescendant(parent: string, descendant: string): boolean {
  if (parent === descendant) {
    return true;
  }
  if (parent.charAt(parent.length - 1) !== sep) {
    parent += sep;
  }
  if (isWindowsPath(parent)) {
    parent = parent.toLowerCase();
    descendant = descendant.toLowerCase();
  }
  return descendant.startsWith(parent);
}

function isWindowsPath(path: string): boolean {
  return /^[a-zA-Z]:\\/.test(path);
}

export function getCleanRepoUrl(url: string): string {
  if (url.endsWith(".git")) {
    return url.substring(0, url.lastIndexOf(".git"));
  }
  return url;
}

function findTaskConfig(name: string, container: any): YamlTaskConfig {
  if (container) {
    const patterns = Object.keys(container);
    patterns.sort((a, b) => b.length - a.length);
    for (const pattern of patterns) {
      const isMatch = picomatch(pattern);
      if (isMatch(name)) {
        return container[pattern];
      }
    }
  }
  return {};
}

export async function fileExists(rootPath: string, apiTechName: string): Promise<boolean> {
  const uri = vscode.Uri.file(`${rootPath}/${apiTechName}`);
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch (e) {
    return false;
  }
}

export function isCheckedOut(collectionTechName: string, gitInfo: GitInfo): boolean {
  return getRepoProps(collectionTechName, gitInfo) !== undefined;
}

export function getGitApiRootPathAndMapName(
  collectionTechName: string,
  gitInfo: GitInfo,
  apiId: string
): RootPathAndMapName | undefined {
  const repoProps = getRepoProps(collectionTechName, gitInfo);
  if (repoProps) {
    const mapping = getInverseMapping(repoProps);
    return [repoProps.rootPath, getMapName(apiId, mapping)];
  }
  return undefined;
}

function getRepoProps(collectionTechName: string, gitInfo: GitInfo): GitRepoProps | undefined {
  const data = collectionTechName.split("@@");
  if (data.length == 1) {
    return undefined;
  }
  const repoUrl = getCleanRepoUrl(data[0]);
  if (repoUrl in gitInfo) {
    const ref = data[1];
    if (ref.startsWith("PR:")) {
      return undefined;
    }
    const repoProps = gitInfo[repoUrl];
    if (ref.startsWith("Tag:")) {
      const tag = ref.replace("Tag:", "");
      if (repoProps.refType === RefType.Tag && repoProps.branch === tag) {
        return repoProps;
      }
    } else if (repoProps.refType === RefType.Head && repoProps.branch === ref) {
      return repoProps;
    }
  }
  return undefined;
}

function getMapName(apiId: string, mapping: Mapping | undefined): string | undefined {
  return mapping ? mapping[apiId] : undefined;
}

function getInverseMapping(repoProps: GitRepoProps): Mapping | undefined {
  const mapping = repoProps.config.mapping;
  if (mapping) {
    const res = {} as Mapping;
    Object.keys(mapping).forEach((key) => {
      res[mapping[key]] = key;
    });
    return res;
  }
}
