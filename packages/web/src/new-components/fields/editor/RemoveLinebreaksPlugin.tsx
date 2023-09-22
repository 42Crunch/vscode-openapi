import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LineBreakNode } from "lexical";
import { useEffect } from "react";

export default function RemoveLinebreaksPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(LineBreakNode, (node) => {
      node.remove();
    });
  }, [editor]);

  return null;
}
