import * as vscode from "vscode";
import { findLocationForJsonPointer, Location } from "@xliic/preserving-json-yaml-parser";

export function getLocationByPointer(
  document: vscode.TextDocument,
  root: any,
  pointer: string
): [number, vscode.Range] {
  // FIXME markerNode can only be returned for the main document
  // perhaps we need to pass Audit here and make this function
  // to return documentUri of current/main document
  // depending on pointer == ""?

  let location: Location;
  if (pointer == "") {
    // if pointer == "" return location for well known node
    // which is depending on OAS version is either "/swagger" or "/openapi
    if (root["openapi"]) {
      location = findLocationForJsonPointer(root, "/openapi");
    } else {
      location = findLocationForJsonPointer(root, "/swagger");
    }
  } else {
    location = findLocationForJsonPointer(root, pointer);
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
