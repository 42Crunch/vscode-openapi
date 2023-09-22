import styled from "styled-components";
import { Parameter } from "./ParameterRow";
import { useWatch } from "react-hook-form";
import DownshiftSelect from "../../../../new-components/DownshiftSelect";

export default function NewParameterSelect({
  name,
  group,
  onSelection,
  placeholder,
}: {
  name: string;
  placeholder: string;
  group: Record<string, Parameter>;
  onSelection: (name: string, parameter: Parameter) => void;
}) {
  const values = useWatch({ name });
  const parameterNames = Object.keys(group);
  const existingValuesNames = values.map(({ key }: { key: string }) => key);
  const arrayParameterNames = Object.entries(group)
    .map(([name, parameter]) => ({
      name,
      isArray: isArray(parameter),
    }))
    .filter(({ isArray }) => isArray)
    .map(({ name }) => name);

  // if it's type array field, or it is not amongst the existing values
  const canBeAddedNames = parameterNames.filter(
    (name) => arrayParameterNames.includes(name) || !existingValuesNames.includes(name)
  );

  const options = parameterNames.map((name) => ({
    label: name,
    value: name,
    disabled: !canBeAddedNames.includes(name),
  }));

  return (
    <Container>
      <div>
        <DownshiftSelect
          placeholder={placeholder}
          options={options}
          onSelectedItemChange={(selection) => {
            if (selection) {
              onSelection(selection.value, group[selection.value]);
            }
          }}
        />
      </div>
    </Container>
  );
}

function isArray(parameter: Parameter) {
  return (
    ("type" in parameter && parameter.type === "array") ||
    ("schema" in parameter && parameter.schema?.type === "array")
  );
}

const Container = styled.div`
  display: flex;
  margin-right: 10px;
  > div {
    flex: 1;
  }
`;
