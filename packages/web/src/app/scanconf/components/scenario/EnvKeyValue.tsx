import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import { TrashCan, ExclamationCircle } from "../../../../icons";
import Select from "../Select";

export default function EnvKeyValue({ name, remove }: { name: string; remove: () => void }) {
  const { control } = useFormContext();

  const {
    field: keyField,
    fieldState: { error },
  } = useController({
    name: `${name}.key`,
    control,
    rules: {
      pattern: {
        value: /^[\w-_]+$/,
        message: "Only the alphanumeric characters, minus or the underscore",
      },
    },
  });

  const { field: valueField } = useController({
    name: `${name}.value`,
    control,
  });

  const { field: typeField } = useController({
    name: `${name}.type`,
    control,
  });

  const possibleTypes = getValueTypes(valueField.value);

  return (
    <Container>
      <KeyValue>
        <Name type="text" {...keyField} />
        <Value type="text" {...valueField} />
        <Type {...typeField}>
          <option value="string">string</option>
          <option value="number" disabled={!possibleTypes.has("number")}>
            number
          </option>
          <option value="boolean" disabled={!possibleTypes.has("boolean")}>
            boolean
          </option>
          <option value="null" disabled={!possibleTypes.has("null")}>
            null
          </option>
        </Type>
        <Remove
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            remove();
          }}
        >
          <TrashCan />
        </Remove>
      </KeyValue>
      {error && (
        <Error>
          <ExclamationCircle />
          &nbsp; {error.message}
        </Error>
      )}
    </Container>
  );
}

function getValueTypes(value: string) {
  const types = new Set(["string"]);
  try {
    const parsed = JSON.parse(value);
    const type = typeof parsed;
    if (type === "number" || type === "boolean") {
      types.add(type);
    } else if (value === "null") {
      types.add("null");
    }
  } catch (e) {
    // failed to parse
  }
  return types;
}

const Container = styled.div`
  display: contents;
`;

const KeyValue = styled.div`
  display: contents;
  &:hover > :last-child {
    visibility: visible;
  }
`;

const Name = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  padding: 4px 8px;
`;

const Value = styled.input`
  flex: 2;
  border: none;
  background: transparent;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  padding: 4px 8px;
`;

const Type = styled.select`
  border: none;
  background: transparent;
  color: var(${ThemeColorVariables.foreground});
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  padding: 4px 8px;
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

const Error = styled.div`
  padding: 4px;
  display: flex;
`;
