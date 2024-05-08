import { useController } from "react-hook-form";
import styled from "styled-components";

import { OpenApi30, Swagger } from "@xliic/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";

import { ENV_VAR_REGEX } from "../../../../core/playbook/variables";
import { TrashCan, TriangleExclamation } from "../../../../icons";
import LineEditor from "../../../../new-components/fields/LineEditor";
import DescriptionTooltip from "../../../../new-components/DescriptionTooltip";

export type Parameter = OpenApi30.ResolvedParameter | Swagger.ResolvedParameter;
export type Schema = { type?: string };
const DefaultSchema = { type: "string" };

export default function ParameterRow({
  name,
  schema,
  onDelete,
  variables,
  isDefinedInOpenAPI,
}: {
  name: string;
  variables: string[];
  schema: Schema | undefined;
  onDelete: () => void;
  isDefinedInOpenAPI: boolean;
}) {
  const {
    fieldState: { error },
  } = useController({ name: `${name}.value` });

  const { field: nameField } = useController({ name: `${name}.key` });

  return (
    <Container>
      <Name>
        {nameField.value}
        {!isDefinedInOpenAPI && (
          <DescriptionTooltip icon="exclamation">
            Parameter is not defined in the OpenAPI specification for this API
          </DescriptionTooltip>
        )}
      </Name>
      <LineEditor
        name={`${name}.value`}
        variables={variables}
        encode={(value) => encode(schema || DefaultSchema, value)}
        decode={(value) => decode(schema, value)}
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
      {error && (
        <>
          <ErrorMessage>
            <TriangleExclamation />
            <span>{error.message}</span>
          </ErrorMessage>
          <div></div>
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: contents;
  &:hover > :last-child {
    opacity: 1;
  }
`;

const ErrorMessage = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  border: none !important;
  align-items: center;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
  display: flex;
  gap: 4px;
  grid-column: span 2;
`;

const Name = styled.div`
  flex: 1;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  margin-right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
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
  opacity: 0;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

function encode(schema: Schema, value: unknown): string {
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

function decode(schema: Schema | undefined, value: string): unknown {
  const type = schema?.type || "string";

  if (value.match(ENV_VAR_REGEX())) {
    return value;
  }

  if (type === "string") {
    return value;
  }

  if (type === "integer") {
    return decodeToInteger(value);
  }

  if (type === "number") {
    return decodeToNumber(value);
  }

  if (type === "boolean") {
    if (value === "true" || value === "false") {
      return value === "true" ? true : false;
    }
    throw new Error("failed to convert to 'boolean'");
  }

  if (type === "object" || type === "array") {
    return decodeToObjectOrArray(value);
  }

  throw new Error(`failed to convert, unsupported type: ${type}`);
}

function decodeToInteger(value: string): number {
  const converted = Number.parseInt(value, 10);
  if (isNaN(converted)) {
    throw new Error("failed to convert to 'integer'");
  }
  return converted;
}

function decodeToNumber(value: string): number {
  const converted = Number.parseFloat(value);
  if (isNaN(converted)) {
    throw new Error("failed to convert to 'number'");
  }
  return converted;
}

function decodeToObjectOrArray(value: string): number {
  try {
    return JSON.parse(value);
  } catch (e) {
    throw new Error(`failed to convert: ${e}`);
  }
}
