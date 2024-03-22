import styled from "styled-components";
import { useFormContext, UseFieldArrayAppend, FieldValues } from "react-hook-form";
import { useRef } from "react";

import { BundledSwaggerOrOasSpec, deref } from "@xliic/openapi";

import { escapeFieldName } from "../../util";
import ArrayField from "./ArrayField";
import Field, { Parameter, Schema } from "./Field";
import { NewParameterTrigger } from "./NewParameterTrigger";

export default function ParameterGroup({
  oas,
  group,
}: {
  oas: BundledSwaggerOrOasSpec;
  group: Record<string, Parameter>;
}) {
  const parameters = Object.values(group);

  const addArrayFieldRef = useRef({} as Record<string, UseFieldArrayAppend<FieldValues, string>>);

  const { unregister, getValues, setValue, setFocus, trigger } = useFormContext();

  const deleteField = (name: string) => {
    unregister(name);
  };

  const addField = async (parameter: Parameter) => {
    const name = parameterToName(parameter);
    if (addArrayFieldRef.current[name] !== undefined) {
      addArrayFieldRef.current[name]("");
    } else {
      const value = isArray(parameter) ? [""] : "";
      setValue(name, value);
      await trigger();
      setFocus(name);
    }
  };

  return (
    <Container>
      {parameters.map((parameter) => {
        const name = parameterToName(parameter);
        if (getValues(name) !== undefined) {
          if (isArray(parameter)) {
            return (
              <ArrayField
                name={name}
                key={name}
                parameter={parameter}
                schema={getArraySchema(oas, parameter)}
                add={addArrayFieldRef}
              />
            );
          } else {
            return (
              <Field
                name={name}
                key={name}
                parameter={parameter}
                schema={getSchema(parameter)}
                onDelete={() => deleteField(name)}
              />
            );
          }
        }
      })}
      <NewParameterTrigger parameters={parameters} onSelection={addField} />
    </Container>
  );
}

function parameterToName(parameter: Parameter) {
  return `parameters.${parameter.in}.${escapeFieldName(parameter.name)}`;
}

function isArray(parameter: Parameter) {
  return (
    ("type" in parameter && parameter.type === "array") ||
    ("schema" in parameter && parameter.schema?.type === "array")
  );
}

function getSchema(parameter: Parameter): Schema | undefined {
  if ("schema" in parameter) {
    return parameter.schema;
  }
  if ("type" in parameter) {
    return parameter;
  }
}

function getArraySchema(oas: BundledSwaggerOrOasSpec, parameter: Parameter) {
  if ("schema" in parameter && parameter.schema?.type === "array") {
    return deref(oas, parameter.schema.items);
  } else if ("type" in parameter && parameter.type === "array") {
    return deref(oas, parameter.items);
  }
}

const Container = styled.div`
  padding: 8px;
  > div {
    margin-bottom: 10px;
  }
`;
