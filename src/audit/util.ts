import * as vscode from "vscode";
import {
  findLocationForJsonPointer,
  getLocation,
  getRootRange,
  Location,
  Parsed,
  parseJsonPointer,
} from "@xliic/preserving-json-yaml-parser";
import { createTempDirectory, exists } from "../util/fs";
import { rmdir, unlink, writeFile } from "node:fs/promises";
import { AuditContext } from "../types";
import { join } from "node:path";

export function getLocationByPointer(
  document: vscode.TextDocument,
  root: any,
  pointer: string
): [number, vscode.Range] {
  // FIXME markerNode can only be returned for the main document
  // perhaps we need to pass Audit here and make this function
  // to return documentUri of current/main document
  // depending on pointer == ""?

  let location: Location | undefined;
  if (pointer == "") {
    // if pointer == "" return location for well known node
    // which is depending on OAS version is either "/swagger" or "/openapi
    if (root["openapi"]) {
      location = findLocationForJsonPointer(root, "/openapi");
    } else {
      location = findLocationForJsonPointer(root, "/swagger");
    }
  } else {
    location = findLocationForJsonPointerResolvingRefs(root, pointer)[0];
  }

  if (location) {
    const start = location.key ? location.key.start : location.value.start;
    const position = document.positionAt(start);
    const line = document.lineAt(position.line);
    const range = new vscode.Range(
      new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex),
      new vscode.Position(position.line, line.range.end.character)
    );
    return [position.line, range];
  } else {
    throw new Error(`Unable to locate node: ${pointer}`);
  }
}

function findLocationForJsonPointerResolvingRefs(
  root: Parsed,
  jsonPointer: string
): [Location | undefined, any] {
  const path = parseJsonPointer(jsonPointer);
  if (path.length === 0) {
    // special case "" pointing to the root
    const range = getRootRange(root);
    return [{ value: range }, root];
  }

  let current: any = root;
  let i = 0;
  while (i < path.length - 1 && current) {
    if (current[path[i]] !== undefined) {
      current = current[path[i]];
      i++;
    } else if (current.hasOwnProperty("$ref")) {
      current = findLocationForJsonPointerResolvingRefs(root, current["$ref"])[1];
    } else {
      return [undefined, undefined];
    }
  }

  if (current != undefined && current[path[i]] === undefined && current.hasOwnProperty("$ref")) {
    current = findLocationForJsonPointerResolvingRefs(root, current["$ref"])[1];
  }

  if (current !== undefined) {
    return [getLocation(current, path[i]), current[path[i]]];
  }
  return [undefined, undefined];
}

export async function saveAuditReportToTempDirectory(data: any) {
  const tempAuditDirectory = createTempDirectory("audit-report");
  await writeFile(`${tempAuditDirectory}/report.json`, JSON.stringify(data, null, 2));
  return tempAuditDirectory;
}

export async function clearAuditReportTempDirectories(auditContext: AuditContext) {
  for (const dir of Object.values(auditContext.auditTempDirectories)) {
    const openapiFilename = join(dir, "openapi.json");
    if (await exists(openapiFilename)) {
      await unlink(openapiFilename);
    }

    const reportFilename = join(dir, "report.json");
    if (await exists(reportFilename)) {
      await unlink(reportFilename);
    }

    const todoFilename = join(dir, "todo.json");
    if (await exists(todoFilename)) {
      await unlink(todoFilename);
    }

    const sqgFilename = join(dir, "sqg.json");
    if (await exists(sqgFilename)) {
      await unlink(sqgFilename);
    }

    await rmdir(dir);
  }
}
