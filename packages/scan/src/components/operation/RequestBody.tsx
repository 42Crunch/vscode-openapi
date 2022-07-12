import { useFormContext, useController, useWatch } from "react-hook-form";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";

import type { BundledOpenApiSpec, OasRequestBody } from "@xliic/common/oas30";

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

  const bodyMediaTypeValue = useWatch({
    control,
    name: "body.mediaType",
  }) as string;

  // update body when media type changes
  useEffect(() => {
    const body = createBody(oas, bodyMediaTypeValue, requestBody?.content?.[bodyMediaTypeValue]);
    setBodyText(serializeToFormText(body));
  }, [bodyMediaTypeValue]);

  // update body text when defaults change
  useEffect(() => {
    const body = control._defaultValues.body;
    setBodyText(serializeToFormText(body));
  }, [control._defaultValues]);

  return (
    <>
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
            bodyValue.onChange(parseFromFormText(bodyMediaType.value, e.target.value));
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

function validate(value: any): any {
  if (value instanceof Error) {
    return value.message;
  }
}
