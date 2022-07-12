import styled from "styled-components";
import { useFormContext, useFieldArray } from "react-hook-form";
import BootstrapButton from "react-bootstrap/Button";

import type { OasSchema, ResolvedOasParameter } from "@xliic/common/oas30";
import Parameter from "./Parameter";

export default function ArrayParameter({
  name,
  parameter,
  schema,
}: {
  name: string;
  parameter: ResolvedOasParameter;
  schema: OasSchema;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control,
    name,
  });

  return (
    <>
      {fields.map((field, index) => (
        <Field key={field.id} className="m-1">
          <Parameter name={`${name}.${index}.value`} parameter={parameter} schema={schema} />
          <Button onClick={() => insert(index + 1, { value: "" })}>+</Button>
          <Button onClick={() => remove(index)}>-</Button>
        </Field>
      ))}
    </>
  );
}

const Button = styled(BootstrapButton)`
  margin-left: 0.25rem;
`;

const Field = styled.div`
  display: flex;
  & > div {
    flex: 1;
  }
`;
