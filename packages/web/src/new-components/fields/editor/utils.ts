import { $createTextNode, LexicalNode } from "lexical";
import { $createVariableNode } from "./VariableNode";

const VAR_REGEX = /({{[\w\-$]+}})/;

export function createLineNodes(line: string): LexicalNode[] {
  const parts = line.split(VAR_REGEX);

  return parts.map((part, index) => {
    const hasMatched = index % 2 !== 0;
    if (hasMatched) {
      return $createVariableNode(part, false);
    } else {
      return $createTextNode(part);
    }
  });
}
