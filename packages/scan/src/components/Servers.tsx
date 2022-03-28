import { useFormContext, Controller } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";

import type { OasServer } from "@xliic/common/oas30";

export default function Servers({
  name,
  servers,
}: {
  name: string;
  servers: OasServer[] | undefined;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  if (servers === undefined) {
    return null;
  }

  return (
    <FloatingLabel className="m-1" label="Server">
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Form.Select onChange={onChange} value={value} ref={ref}>
            {servers.map((server) => (
              <option key={server.url}>{server.url}</option>
            ))}
          </Form.Select>
        )}
      />
    </FloatingLabel>
  );
}
