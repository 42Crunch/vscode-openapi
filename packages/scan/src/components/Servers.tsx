import styled from "styled-components";
import { useFormContext, Controller, useController } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { ThemeColors } from "@xliic/common/theme";

import type { OasServer } from "@xliic/common/oas30";

export default function Servers({ servers }: { servers: OasServer[] }) {
  const { control } = useFormContext();

  const {
    field: { onChange, value, ref },
    fieldState: { error },
  } = useController({
    name: "server",
    control,
    rules: {
      validate: (value) => validate(value),
    },
  });

  return (
    <FloatingLabel className="m-1" label="Server">
      <Form.Select
        onChange={onChange}
        value={value}
        ref={ref}
        className={error ? "is-invalid" : undefined}
      >
        {servers.map((server) => (
          <option key={server.url}>{server.url}</option>
        ))}
      </Form.Select>
      {error && <div className="invalid-feedback">{error.message}</div>}
    </FloatingLabel>
  );
}

function validate(value: any): any {
  if (value === "") {
    return "Server is required";
  }
}

const Error = styled.div`
  border: 1px solid var(${ThemeColors.errorBorder});
  color: var(${ThemeColors.errorForeground});
  background-color: var(${ThemeColors.errorBackground});
  border-radius: 0.375rem;
  margin-right: 0.25rem;
  margin-left: 0.25rem;
  padding: 0.75rem;
`;
