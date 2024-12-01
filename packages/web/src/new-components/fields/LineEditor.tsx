import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { HTMLAttributes, useEffect } from "react";
import { useController } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import RemoveLinebreaksPlugin from "./editor/RemoveLinebreaksPlugin";
import { VariableNode } from "./editor/VariableNode";
import VariablesPlugin from "./editor/VariablesPlugin";

export default function LineEditor({
  name,
  variables,
  encode,
  decode,
  ...attrs
}: {
  name: string;
  variables?: string[];
  encode?: (value: unknown) => string;
  decode?: (value: string) => unknown;
} & HTMLAttributes<HTMLDivElement>) {
  const { field } = useController({
    name,
    rules: {
      validate: (value) => {
        if (value instanceof Error) {
          return value.message;
        }
      },
    },
  });

  function onError(error: any) {
    console.error(error);
  }

  const initialConfig = {
    namespace: "editor",
    editorState: () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(encode ? encode(field.value) : field.value));
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
    <Container {...attrs} onBlur={field.onBlur}>
      <LexicalComposer initialConfig={initialConfig}>
        <>
          <PlainTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div></div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          {variables !== undefined && <VariablesPlugin variables={variables} />}
          <FormPlugin name={name} decode={decode} />
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

function FormPlugin({ name, decode }: { name: string; decode?: (value: string) => unknown }) {
  const [editor] = useLexicalComposerContext();

  const { field } = useController({
    name,
  });

  useEffect(() => {
    field.ref({ focus: () => editor.focus() });

    const cleanup1 = editor.registerTextContentListener((text) => {
      try {
        field.onChange(decode ? decode(text) : text);
      } catch (e: any) {
        field.onChange(e);
      }
    });

    const cleanup2 = editor.registerCommand(
      BLUR_COMMAND,
      (payload, editor) => {
        field.onBlur();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      cleanup1();
      cleanup2();
    };
  }, [editor, field]);

  return null;
}
