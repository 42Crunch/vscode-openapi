import * as vscode from "vscode";
import { Node } from "@xliic/openapi-ast-node";

export function getLocationByPointer(
  document: vscode.TextDocument,
  root: Node,
  pointer: string
): [number, vscode.Range] {
  // FIXME markerNode can only be returned for the main document
  // perhaps we nee dto pass Audit here and make this function
  // to return documentUri of current/main document
  // depending on pointer == ""?
  const markerNode = root.find("/openapi") || root.find("/swagger");
  const node = pointer === "" ? markerNode : root.find(pointer);
  if (node) {
    const [start, end] = node.getRange();
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
