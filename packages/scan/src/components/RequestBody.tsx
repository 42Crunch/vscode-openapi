import { useFormContext, useController, useWatch } from "react-hook-form";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";

import type { BundledOpenApiSpec, OasRequestBody } from "@xliic/common/oas30";

import Section from "./Section";
import { useEffect, useState } from "react";
import { generateBody } from "../util";

export default function RequestBody({
  oas,
  requestBody,
}: {
  oas: BundledOpenApiSpec;
  requestBody?: OasRequestBody;
}) {
  const { control } = useFormContext();

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

  const bodyMediaTypeValue = useWatch({
    control,
    name: "body.mediaType",
  });

  // update body when media type changes
  useEffect(() => {
    const body = generateBody(oas, requestBody, bodyMediaTypeValue);
    setBodyText(convertDataToForm(bodyMediaTypeValue, body));
  }, [bodyMediaTypeValue]);

  // update body text when defaults change
  useEffect(() => {
    const body = control._defaultValues.body;
    setBodyText(convertDataToForm(body.mediaType, body.value));
  }, [control._defaultValues]);

  return (
    <>
      <Section>request body</Section>
      <FloatingLabel className="m-1" label="media type">
        <Form.Select
          onChange={bodyMediaType.onChange}
          value={bodyMediaType.value}
          ref={bodyMediaType.ref}
        >
          {Object.keys(requestBody.content).map((mediaType) => (
            <option key={mediaType}>{mediaType}</option>
          ))}
        </Form.Select>
      </FloatingLabel>
      <div className="m-1">
        <Form.Control
          as="textarea"
          className={error ? "is-invalid" : undefined}
          rows={10}
          onChange={(e) => {
            bodyValue.onChange(convertFormToData(bodyMediaType.value, e.target.value));
            setBodyText(e.target.value);
          }}
          onBlur={bodyValue.onBlur}
          value={bodyText}
          ref={bodyValue.ref}
        />
        {error && <div className="invalid-feedback">{error.message}</div>}
      </div>
    </>
  );
}

function convertDataToForm(mediaType: string, value: any): string {
  if (mediaType === "application/json") {
    return JSON.stringify(value, null, 2);
  }
  // text/plain
  return value;
}

function convertFormToData(mediaType: string, value: string): string | Error {
  if (mediaType === "application/json") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return new Error(`failed to convert: ${e}`);
    }
  }
  // text/plain
  return value;
}

function validate(value: any): any {
  if (value instanceof Error) {
    return value.message;
  }
}
