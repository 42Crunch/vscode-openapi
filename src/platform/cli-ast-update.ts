/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import got from "got";
import * as vscode from "vscode";
import * as semver from "semver";

export type CliAstPlatform = "windows-amd64" | "darwin-arm64" | "darwin-amd64" | "linux-amd64";

export type CliAstManifestEntry = {
  name: string;
  architecture: CliAstPlatform;
  version: string;
  releaseDate: string;
  downloadUrl: string;
  sha256: string;
};

export type CliAstManifest = CliAstManifestEntry[];

async function readManifest(repository: string): Promise<CliAstManifest> {
  const manifestUrl = vscode.Uri.joinPath(vscode.Uri.parse(repository), "42c-ast-manifest.json");
  const manifest = (await got(manifestUrl.toString()).json()) as CliAstManifest;
  return manifest;
}

export async function getCliUpdate(
  repository: string,
  currentVersion: string
): Promise<CliAstManifestEntry | undefined> {
  const manifest = await readManifest(repository);
  const platform = getCliAstPlatform();
  const current = semver.parse(currentVersion);
  for (const entry of manifest) {
    if (entry.architecture === platform) {
      const latest = semver.parse(entry.version);
      if (current === null) {
        return entry;
      } else if (latest && semver.gt(latest, current)) {
        return entry;
      }
    }
  }
}

function getCliAstPlatform(): CliAstPlatform | undefined {
  if (process.platform === "win32") {
    return "windows-amd64";
  } else if (process.platform === "darwin" && process.arch == "arm64") {
    return "darwin-arm64";
  } else if (process.platform === "darwin" && process.arch == "x64") {
    return "darwin-amd64";
  } else if (process.platform === "linux" && process.arch == "x64") {
    return "linux-amd64";
  }
}
