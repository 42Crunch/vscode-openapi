import styled from "styled-components";
import { useEffect, useState } from "react";
import { useFormContext, useController } from "react-hook-form";

import { OpenApi30 } from "@xliic/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";

import { TriangleExclamation } from "../../icons";
import { createBody, serializeToFormText, parseFromFormText } from "../../core/form/body";

export default function RequestBody({
  oas,
  requestBody,
}: {
  oas: OpenApi30.BundledSpec;
  requestBody?: OpenApi30.RequestBody;
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

  const [bodyText, setBodyText] = useState(
    serializeToFormText({ mediaType: bodyMediaType.value, value: bodyValue.value })
  );

  // update body on changes
  useEffect(() => {
    if (bodyValue.value instanceof Error) {
      return;
    }
    if (
      JSON.stringify(parseFromFormText(bodyMediaType.value, bodyText)) !==
      JSON.stringify(bodyValue.value)
    ) {
      const body = createBody(
        oas,
        bodyMediaType.value,
        requestBody?.content?.[bodyMediaType.value],
        bodyValue.value
      );
      setBodyText(serializeToFormText(body));
    }
  }, [bodyMediaType.value, bodyValue.value, bodyText]);

  return (
    <Container>
      <select
        onChange={(e) => {
          const mediaType = e.target.value;
          const body = createBody(oas, mediaType, requestBody?.content?.[mediaType]);
          bodyMediaType.onChange(mediaType);
          bodyValue.onChange(body.value);
        }}
        value={bodyMediaType.value}
        ref={bodyMediaType.ref}
      >
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
      {error && (
        <ErrorMessage>
          <TriangleExclamation /> {error.message}
        </ErrorMessage>
      )}
    </Container>
  );
}

function validate(value: any): any {
  console.log("body validate", value);
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
