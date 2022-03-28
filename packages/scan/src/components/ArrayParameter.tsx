import styled from "styled-components";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

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

  console.log("fileds", fields);

  return (
    <>
      {fields.map((field, index) => (
        <Field key={field.id} className="m-1">
          <Parameter name={`${name}.${index}.value`} parameter={parameter} schema={schema} />
          <Button className="m-1" variant="light" onClick={() => insert(index + 1, { value: "" })}>
            +
          </Button>
          <Button className="m-1" variant="light" onClick={() => remove(index)}>
            -
          </Button>
        </Field>
      ))}
    </>
  );
}

const Field = styled.div`
  display: flex;
  & > div {
    flex: 1;
  }
`;
