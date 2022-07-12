import { useFormContext, useController } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";

import type { OasSecurityScheme } from "@xliic/common/oas30";

export function SecurityGeneric({
  name,
  schema,
  schemaKey,
}: {
  name: string;
  schema: OasSecurityScheme;
  schemaKey: string;
}) {
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

  return (
    <>
      <FloatingLabel label={schemaKey} className="m-1">
        <Form.Control
          type="text"
          className={error ? "is-invalid" : undefined}
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
          ref={field.ref}
        />
        {error && <div className="invalid-feedback">{error.message}</div>}
      </FloatingLabel>
    </>
  );
}

function validate(value: any): any {
  return undefined; // validation passes
}
