import { tmpdir } from "node:os";
import { accessSync, constants, mkdtempSync, statSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";
import { access } from "node:fs/promises";

export function createTempDirectory(prefix: string) {
  const tmpDir = tmpdir();
  const dir = mkdtempSync(join(`${tmpDir}`, prefix));
  return dir;
}

export function existsSync(filename: string) {
  try {
    accessSync(filename, constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function exists(filename: string): Promise<boolean> {
  try {
    await access(filename, constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export function existsDir(filename: string): boolean {
  try {
    const stats = statSync(filename);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

export async function existsUri(uri: vscode.Uri): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return true;
  } catch (e) {
    return false;
  }
}
