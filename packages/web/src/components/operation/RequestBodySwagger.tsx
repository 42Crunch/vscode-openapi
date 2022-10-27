import { useEffect, useState } from "react";
import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";

import { BundledSwaggerSpec, ResolvedSwaggerParameter } from "@xliic/common/swagger";

import { createBody, serializeToFormText, parseFromFormText } from "../../core/form/body-swagger";

function serialize(value: any): string {
  return JSON.stringify(value, null, 2);
}

function parse(value: string | undefined): unknown {
  if (value === undefined || value === "") {
    return undefined;
  }
  return JSON.parse(value);
}

export default function RequestBodySwagger({
  oas,
  group,
}: {
  oas: BundledSwaggerSpec;
  group: Record<string, ResolvedSwaggerParameter>;
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

  const [bodyText, setBodyText] = useState("");

  useEffect(() => {
    if (bodyValue.value !== undefined) {
      setBodyText(serialize(bodyValue.value));
    }
  }, [bodyValue.value]);

  return (
    <Container>
      <textarea
        rows={10}
        onChange={(e) => {
          setBodyText(e.target.value);
          bodyValue.onChange(parse(e.target.value));
        }}
        onBlur={bodyValue.onBlur}
        value={bodyText}
        ref={bodyValue.ref}
      />
      {/* {error && <div className="invalid-feedback">{error.message}</div>} */}
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

function validate(value: any): any {
  if (value instanceof Error) {
    return value.message;
  }
}
