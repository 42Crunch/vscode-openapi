import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";

import type { BundledOpenApiSpec, OasRequestBody } from "@xliic/common/oas30";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useEffect, useState } from "react";
import { createBody, serializeToFormText, parseFromFormText } from "../../core/form/body";

export default function RequestBody({
  oas,
  requestBody,
}: {
  oas: BundledOpenApiSpec;
  requestBody?: OasRequestBody;
}) {
  const { control } = useFormContext();

  // FIXME create json body if requestBody is not defined
  if (requestBody === undefined) {
    return null;
  }

  const { field: bodyMediaType } = useController({
    name: "body.mediaType",
    control,
  });

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

  // update body on changes
  useEffect(() => {
    if (bodyMediaType.value !== undefined) {
      const body = createBody(
        oas,
        bodyMediaType.value,
        requestBody?.content?.[bodyMediaType.value],
        bodyValue.value
      );
      setBodyText(serializeToFormText(body));
    }
  }, [bodyMediaType.value, bodyValue.value]);

  return (
    <Container>
      <select onChange={bodyMediaType.onChange} value={bodyMediaType.value} ref={bodyMediaType.ref}>
        {Object.keys(requestBody.content).map((mediaType) => (
          <option key={mediaType}>{mediaType}</option>
        ))}
      </select>
      <textarea
        rows={10}
        onChange={(e) => {
          bodyValue.onChange(parseFromFormText(bodyMediaType.value, e.target.value));
          setBodyText(e.target.value);
        }}
        onBlur={bodyValue.onBlur}
        value={bodyText}
        ref={bodyValue.ref}
      />
      {error && <div className="invalid-feedback">{error.message}</div>}
    </Container>
  );
}

function validate(value: any): any {
  if (value instanceof Error) {
    return value.message;
  }
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

  & > select {
    padding: 4px;
    color: var(${ThemeColorVariables.foreground});
    background-color: var(${ThemeColorVariables.background});
    border: none;
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;
