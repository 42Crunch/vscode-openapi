import path from "node:path";
import * as vscode from "vscode";

export function basename(uri: vscode.Uri): string {
  return path.posix.basename(uri.path);
}

export function relative(root: vscode.Uri, uri: vscode.Uri): string {
  return path.posix.relative(root.path, uri.path);
}

export function dirname(uri: vscode.Uri): string {
  if (uri.path.length === 0 || uri.path === "/") {
    return "/";
  }

  return path.posix.dirname(uri.path);
}

export function dirnameUri(uri: vscode.Uri): vscode.Uri {
  if (uri.path.length === 0 || uri.path === "/") {
    return uri.with({ path: "/" });
  }

  return uri.with({ path: path.posix.dirname(uri.path) });
}

export async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch (err) {
    return false;
  }
}

export async function existsDir(uri: vscode.Uri): Promise<boolean> {
  try {
    const stats = await vscode.workspace.fs.stat(uri);
    return stats.type === vscode.FileType.Directory;
  } catch (err) {
    return false;
  }
}
