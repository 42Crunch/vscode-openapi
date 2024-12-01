import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ThemeColorVariables } from "@xliic/common/theme";
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot } from "lexical";

import { useEffect } from "react";
import { useController } from "react-hook-form";
import styled from "styled-components";
import { VariableNode } from "./editor/VariableNode";

export default function PlaintextEditor({ name }: { name: string }) {
  const {
    field: { value },
  } = useController({ name });

  function onError(error: any) {
    console.error(error);
  }

  const initialConfig = {
    namespace: "editor",
    editorState: () => {
      const paragraph = $createParagraphNode();
      const lines = value.split("\n");
      for (let i = 0; i < lines.length; i++) {
        paragraph.append($createTextNode(lines[i]));
        if (i < lines.length - 1) {
          paragraph.append($createLineBreakNode());
        }
      }
      $getRoot().append(paragraph);
    },
    theme: {
      root: "editor",
      paragraph: "editor-paragraph",
    },
    onError,
    nodes: [VariableNode],
  };

  return (
    <Container>
      <LexicalComposer initialConfig={initialConfig}>
        <PlainTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<div></div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <FormPlugin name={name} />
      </LexicalComposer>
    </Container>
  );
}

function FormPlugin({ name }: { name: string }) {
  const [editor] = useLexicalComposerContext();

  const { field } = useController({
    name,
  });

  useEffect(() => {
    return editor.registerTextContentListener((text) => {
      field.onChange(text);
    });
  }, [editor, field]);

  return null;
}

const Container = styled.div`
  color: var(${ThemeColorVariables.foreground});
  background-color: var(${ThemeColorVariables.background});
  border: 1px solid var(${ThemeColorVariables.border});

  &:focus-within {
    //border: 1px solid var(${ThemeColorVariables.focusBorder});
    outline: 1px solid -webkit-focus-ring-color;
    outline-offset: -1px;
  }
  > .editor:focus {
    outline: none;
  }
  > .editor {
    font-family: monospace;
    font-size: 13.333px;
    margin: 4px;
    max-height: 300px;
    overflow: scroll;
  }
  .editor-paragraph {
    margin: 0;
  }
`;
