import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ThemeColorVariables } from "@xliic/common/theme";
import { $createParagraphNode, $getRoot } from "lexical";
import { HTMLAttributes, useEffect } from "react";
import { useController } from "react-hook-form";
import styled from "styled-components";
import RemoveLinebreaksPlugin from "./editor/RemoveLinebreaksPlugin";
import { VariableNode } from "./editor/VariableNode";
import VariablesPlugin from "./editor/VariablesPlugin";
import { createLineNodes } from "./editor/utils";

export default function LineEditor({
  name,
  variables,
  ...attrs
}: { name: string; variables?: string[] } & HTMLAttributes<HTMLDivElement>) {
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
      const paragraph = $createParagraphNode();
      paragraph.append(...createLineNodes(value));
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
    <Container {...attrs}>
      <LexicalComposer initialConfig={initialConfig}>
        <>
          <PlainTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div></div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          {variables !== undefined && <VariablesPlugin variables={variables} />}
          <FormPlugin name={name} />
          <RemoveLinebreaksPlugin />
        </>
      </LexicalComposer>
    </Container>
  );
}

const Container = styled.div`
  background: transparent;
  padding: 2px;
  color: var(${ThemeColorVariables.foreground});
  padding: 4px;
  &:focus-within,
  &:focus {
    outline: none;
  }
  > .editor:focus {
    outline: none;
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

  return null;
}
