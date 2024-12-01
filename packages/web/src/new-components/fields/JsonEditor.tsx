import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ThemeColorVariables } from "@xliic/common/theme";
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot } from "lexical";

import { useEffect, useState } from "react";
import { useController } from "react-hook-form";
import styled from "styled-components";
import { VariableNode } from "./editor/VariableNode";
import VariablesPlugin from "./editor/VariablesPlugin";
import { CircleCheck, ExclamationCircle } from "../../icons";

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
        <VariablesPlugin variables={variables} />
        <FormPlugin name={name} />
      </LexicalComposer>
    </Container>
  );
}

function FormPlugin({ name }: { name: string }) {
  const [editor] = useLexicalComposerContext();

  const [error, setError] = useState<string | undefined>(undefined);

  const { field } = useController({
    name,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    return editor.registerTextContentListener((text) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      try {
        field.onChange(JSON.parse(text));
        setError(undefined);
      } catch (e) {
        timeoutId = setTimeout(() => {
          if (e instanceof SyntaxError) {
            setError(e.message);
          } else {
            setError(`${e}`);
          }
        }, 500);
      }
    });
  }, [editor, field]);

  if (error === undefined) {
    return (
      <StatusLine>
        Valid JSON
        <CircleCheck
          style={{
            fill: `var(${ThemeColorVariables.foreground})`,
          }}
        />
      </StatusLine>
    );
  } else {
    return (
      <StatusLine error>
        {error}
        <ExclamationCircle
          style={{
            fill: `var(${ThemeColorVariables.errorForeground})`,
          }}
        />
      </StatusLine>
    );
  }
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

const StatusLine = styled.div<{ error?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 2px 4px;
  border-top: 1px solid var(${ThemeColorVariables.border});
  line-break: anywhere;
  color: ${({ error }) =>
    error
      ? `var(${ThemeColorVariables.errorForeground})`
      : `var(${ThemeColorVariables.foreground})`};
  background-color: ${({ error }) =>
    error
      ? `var(${ThemeColorVariables.errorBackground})`
      : `var(${ThemeColorVariables.background})`};
`;
