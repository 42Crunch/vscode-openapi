import { useState, useEffect } from "react";
import { useFormContext, useController } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { OpenApi30, Swagger } from "@xliic/openapi";

import { TrashCan, TriangleExclamation } from "../../icons";

export type Parameter = OpenApi30.ResolvedParameter | Swagger.ResolvedParameter;
export type Schema = { type?: string };
const DefaultSchema = { type: "string" };

export default function Field({
  name,
  parameter,
  schema,
  onDelete,
}: {
  name: string;
  parameter: Parameter;
  schema: Schema | undefined;
  onDelete: () => void;
}) {
  const { control, setError, clearErrors } = useFormContext();

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: {
      validate: (value) => validate(schema || DefaultSchema, value),
    },
  });

  const [value, setValue] = useState(convertDataToForm(schema || DefaultSchema, field.value));

  useEffect(() => {
    setValue(convertDataToForm(schema || DefaultSchema, field.value));
  }, [control._defaultValues]);

  return (
    <Container>
      <Content>
        <Name>{parameter.name}</Name>
        <Value
          type="text"
          onChange={(e) => {
            setValue(e.target.value);
            try {
              field.onChange(convertFormToData(schema, e.target.value));
              clearErrors(name);
            } catch (e: any) {
              setError(name, { message: `${e}` });
            }
          }}
          onBlur={field.onBlur}
          value={value}
          ref={field.ref}
        />
        <Remove
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        >
          <TrashCan />
        </Remove>
      </Content>
      {error && (
        <ErrorMessage>
          <TriangleExclamation /> {error.message}
        </ErrorMessage>
      )}
    </Container>
  );
}

const Container = styled.div``;

const ErrorMessage = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    padding-right: 4px;
  }
  display: flex;
  margin: 4px 0;
`;

const Content = styled.div`
  display: flex;
  &:hover > :last-child {
    visibility: visible;
  }
`;

const Name = styled.div`
  flex: 1;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  margin-right: 10px;
`;

const Value = styled.input`
  flex: 2;
  border: none;
  background: transparent;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
`;

const Remove = styled.button`
  background: none;
  border: none;
  padding: 0;
  width: 1.5em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

function validate(schema: Schema, value: unknown): any {
  if (value instanceof Error) {
    return value.message;
  }
}

function convertDataToForm(schema: Schema, value: unknown): string {
  if (value === undefined) {
    return "";
  }

  const type = schema.type;
  if (
    type === undefined ||
    type === "string" ||
    type === "number" ||
    type === "integer" ||
    type === "boolean"
  ) {
    return `${value}`;
  }

  // object or array
  return JSON.stringify(value);
}

function convertFormToData(schema: Schema | undefined, value: string): any {
  const type = schema?.type || "string";
  if (type === "string") {
    return value;
  }
  if (type === "integer") {
    return convertToInteger(value);
  }
  if (type === "number") {
    return convertToNumber(value);
  }
  if (type === "boolean") {
    if (value === "true" || value === "false") {
      return value === "true" ? true : false;
    }
    throw new Error("failed to convert to 'boolean'");
  }
  if (type === "object" || type === "array") {
    return convertToObjectOrArray(value);
  }
  throw new Error(`failed to convert, unsupported type: ${type}`);
}

function convertToInteger(value: string): number {
  const converted = Number.parseInt(value, 10);
  if (isNaN(converted)) {
    throw new Error("failed to convert to 'integer'");
  }
  return converted;
}

function convertToNumber(value: string): number {
  const converted = Number.parseFloat(value);
  if (isNaN(converted)) {
    throw new Error("failed to convert to 'number'");
  }
  return converted;
}

function convertToObjectOrArray(value: string): number {
  try {
    return JSON.parse(value);
  } catch (e) {
    throw new Error(`failed to convert: ${e}`);
  }
}
