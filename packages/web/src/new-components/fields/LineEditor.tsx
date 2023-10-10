import { HashtagNode } from "@lexical/hashtag";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ThemeColorVariables } from "@xliic/common/theme";
import { $createParagraphNode, $createTextNode, $getRoot, LineBreakNode } from "lexical";
import { useEffect } from "react";
import { useController } from "react-hook-form";
import styled from "styled-components";
import { VariableNode } from "./editor/VariableNode";
import VariablesPlugin from "./editor/VariablesPlugin";

export default function LineEditor({ name, variables }: { name: string; variables: string[] }) {
  const {
    field: { value },
  } = useController({
    name,
  });
  function onError(error: any) {
    console.error(error);
  }

  const initialConfig = {
    namespace: "MyEditor",
    editorState: () => {
      const paragraph = $createParagraphNode();
      const textNode = $createTextNode(value);
      paragraph.append(textNode);
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
        <HashtagPlugin />
      </LexicalComposer>
    </Container>
  );
}

const Container = styled.div`
  padding: 4px;
  color: var(${ThemeColorVariables.foreground});
  //background-color: var(${ThemeColorVariables.background});
  border: 1px solid var(${ThemeColorVariables.border});
  font-family: monospace;
  font-size: 13.333px;
  &:focus-within {
    //border: 1px solid var(${ThemeColorVariables.focusBorder});
    outline: 1px solid -webkit-focus-ring-color;
    outline-offset: -1px;
  }
  > .editor::-webkit-scrollbar {
    //display: none;
  }

  > .editor:focus {
    outline: none;
  }
  > .editor {
    //overflow: scroll;
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
      field.onChange(text);
    });
  }, [editor, field]);

  useEffect(() => {
    return editor.registerNodeTransform(LineBreakNode, (node) => {
      node.remove();
    });
  }, [editor]);

  return null;
}
