import styled from "styled-components";
import { useEffect, useState } from "react";
import { useFormContext, useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";

import { TriangleExclamation } from "../../../../icons";

export default function JsonData({ name }: { name: string }) {
  const { control } = useFormContext();

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: {
      validate: (value) => validate(value),
    },
  });

  const [jsonText, setJsonText] = useState(serialize(field.value));

  // update JSON text on changes
  useEffect(() => {
    if (field.value instanceof Error) {
      return;
    }
    if (JSON.stringify(parse(jsonText)) !== JSON.stringify(field.value)) {
      setJsonText(serialize(field.value));
    }
  }, [field.value]);

  return (
    <Container>
      <textarea
        rows={10}
        onChange={(e) => {
          field.onChange(parse(e.target.value));
          setJsonText(e.target.value);
        }}
        onBlur={field.onBlur}
        value={jsonText}
        ref={field.ref}
      />
      {error && (
        <ErrorMessage>
          <TriangleExclamation /> {error.message}
        </ErrorMessage>
      )}
    </Container>
  );
}

function validate(value: any): any {
  if (value instanceof Error) {
    return value.message;
  }
}

function parse(value: string): unknown | Error {
  try {
    return JSON.parse(value);
  } catch (e) {
    return new Error(`failed to convert: ${e}`);
  }
}

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;

  & > textarea {
    color: var(${ThemeColorVariables.foreground});
    background-color: var(${ThemeColorVariables.background});
    border: 1px solid var(${ThemeColorVariables.border});
    padding: 4px;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: var(${ThemeColorVariables.errorForeground});
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    padding-right: 4px;
  }
  display: flex;
  margin: 4px 0;
`;
