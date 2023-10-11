import { HashtagNode } from "@lexical/hashtag";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ThemeColorVariables } from "@xliic/common/theme";
import { $createLineBreakNode, $createParagraphNode, $getRoot } from "lexical";
import { useEffect } from "react";
import { useController } from "react-hook-form";
import styled from "styled-components";
import { VariableNode } from "./editor/VariableNode";
import VariablesPlugin from "./editor/VariablesPlugin";
import { createLineNodes } from "./editor/utils";

export default function JsonEditor({ name, variables }: { name: string; variables: string[] }) {
  const {
    field: { value },
  } = useController({
    name,
  });
  function onError(error: any) {
    console.error(error);
  }

  const initialConfig = {
    namespace: "editor",
    editorState: () => {
      const serialized = JSON.stringify(value, null, 2);
      const paragraph = $createParagraphNode();
      const lines = serialized.split("\n");
      for (let i = 0; i < lines.length; i++) {
        paragraph.append(...createLineNodes(lines[i]));
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
    nodes: [VariableNode, HashtagNode],
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
        <VariablesPlugin variables={variables} />
        <FormPlugin name={name} />
      </LexicalComposer>
    </Container>
  );
}

const Container = styled.div`
  padding: 4px;
  color: var(${ThemeColorVariables.foreground});
  background-color: var(${ThemeColorVariables.background});
  border: 1px solid var(${ThemeColorVariables.border});
  font-family: monospace;
  font-size: 13.333px;
  &:focus-within {
    //border: 1px solid var(${ThemeColorVariables.focusBorder});
    outline: 1px solid -webkit-focus-ring-color;
    outline-offset: -1px;
  }
  > .editor:focus {
    outline: none;
  }
  > .editor {
  }
  .editor-paragraph {
    margin: 0;
  }
`;

function FormPlugin({ name }: { name: string }) {
  const [editor] = useLexicalComposerContext();

  const { field } = useController({
    name,
  });

  useEffect(() => {
    return editor.registerTextContentListener((text) => {
      try {
        field.onChange(JSON.parse(text));
      } catch (e) {
        console.log("failed to parse");
      }
    });
  }, [editor, field]);

  return null;
}
