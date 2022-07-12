import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";

import type { OasSecurityScheme } from "@xliic/common/oas30";

export function SecurityHttpBasic({
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
    field: usernameField,
    fieldState: { error: usernameError },
  } = useController({
    name: `${name}.username`,
    control,
    rules: {
      validate: (value) => validate(value),
    },
  });

  const {
    field: passwordField,
    fieldState: { error: passwordError },
  } = useController({
    name: `${name}.password`,
    control,
    rules: {
      validate: (value) => validate(value),
    },
  });

  return (
    <Container>
      <FloatingLabel label="username">
        <Form.Control
          type="text"
          className={usernameError ? "is-invalid" : undefined}
          onChange={usernameField.onChange}
          onBlur={usernameField.onBlur}
          value={usernameField.value}
          ref={usernameField.ref}
        />
        {usernameError && <div className="invalid-feedback">{usernameError.message}</div>}
      </FloatingLabel>
      <FloatingLabel label="password">
        <Form.Control
          type="text"
          className={passwordError ? "is-invalid" : undefined}
          onChange={passwordField.onChange}
          onBlur={passwordField.onBlur}
          value={passwordField.value}
          ref={passwordField.ref}
        />
        {passwordError && <div className="invalid-feedback">{passwordError.message}</div>}
      </FloatingLabel>
    </Container>
  );
}

function validate(value: any): any {
  return undefined; // validation passes
}

const Container = styled.div`
  margin: 0.25rem;
  display: flex;
  & > div:first-child {
    margin-right: 0.25rem;
  }
  & > div {
    flex: 1;
  }
`;
