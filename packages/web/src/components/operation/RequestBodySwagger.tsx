import { useEffect, useState } from "react";
import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Swagger } from "@xliic/openapi";

import { TriangleExclamation } from "../../icons";

function serialize(value: any): string {
  return JSON.stringify(value, null, 2);
}

function parse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (e) {
    return new Error(`failed to convert: ${e}`);
  }
}

export default function RequestBodySwagger({
  oas,
  group,
}: {
  oas: Swagger.BundledSpec;
  group: Record<string, Swagger.ResolvedParameter>;
}) {
  const { control } = useFormContext();

  const {
    field: bodyValue,
    fieldState: { error },
  } = useController({
    name: "body.value",
    control,
    rules: {
      validate: (value) => validate(value),
    },
  });

  const [bodyText, setBodyText] = useState(serialize(bodyValue.value));

  // update body on changes
  useEffect(() => {
    if (bodyValue.value instanceof Error) {
      return;
    }

    if (JSON.stringify(parse(bodyText)) !== JSON.stringify(bodyValue.value)) {
      setBodyText(serialize(bodyValue.value));
    }
  }, [bodyValue.value, bodyText]);

  return (
    <Container>
      <textarea
        rows={10}
        onChange={(e) => {
          bodyValue.onChange(parse(e.target.value));
          setBodyText(e.target.value);
        }}
        onBlur={bodyValue.onBlur}
        value={bodyText}
        ref={bodyValue.ref}
      />
      {error && (
        <ErrorMessage>
          <TriangleExclamation /> {error.message}
        </ErrorMessage>
      )}
    </Container>
  );
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

function validate(value: any): any {
  if (value instanceof Error) {
    return value.message;
  }
}
