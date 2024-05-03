import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BLUR_COMMAND, COMMAND_PRIORITY_EDITOR, FOCUS_COMMAND } from "lexical";
import { useEffect } from "react";

export function EditorFocusPlugin({ onFocus }: { onFocus: (focus: boolean) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let timer: any = null;

    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          onFocus(false);
        }, 100);
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
    editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        onFocus(true);
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, []);

  return null;
}
