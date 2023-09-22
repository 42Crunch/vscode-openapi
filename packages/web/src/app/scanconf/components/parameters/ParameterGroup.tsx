import { useFieldArray } from "react-hook-form";
import styled from "styled-components";

import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { deref } from "@xliic/common/ref";
import { ThemeColorVariables } from "@xliic/common/theme";

import ParameterRow, { Parameter, Schema } from "./ParameterRow";
import NewParameterSelect from "./NewParameterSelect";

export default function ParameterGroup({
  oas,
  name,
  group,
  placeholder,
  variables,
}: {
  group: Record<string, Parameter>;
  oas: BundledSwaggerOrOasSpec;
  name: string;
  placeholder: string;
  variables: string[];
}) {
  const { fields, append, remove } = useFieldArray({
    name: name,
  });

  const addField = async (name: string, parameter: Parameter) => {
    append({ key: name, value: "" }, { shouldFocus: true });
  };

  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
        <div></div>
      </Header>
      <Body>
        {fields.map((field: any, index) => {
          if (group[field.key]) {
            const parameter = group[field.key];
            const schema = isArray(parameter)
              ? getArraySchema(oas, parameter)
              : getSchema(parameter);
            return (
              <ParameterRow
                name={`${name}.${index}.value`}
                key={field.id}
                parameter={parameter}
                schema={schema}
                onDelete={() => remove(index)}
                variables={variables}
              />
            );
          }
        })}

        <NewParameterSelect
          placeholder={placeholder}
          name={name}
          group={group}
          onSelection={addField}
        />
      </Body>
    </Container>
  );
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
  display: grid;
  row-gap: 4px;
  grid-template-columns: 1fr 2fr 1em;
`;

const Header = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Body = styled.div`
  display: contents;
  & > div > div,
  & > div > input {
    padding: 4px 8px;
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;
