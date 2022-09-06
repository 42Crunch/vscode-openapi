import { useFormContext, useController } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";

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
        {servers.map((server, index) => (
          <option key={`${server?.url}-${index}`}>{server?.url}</option>
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
