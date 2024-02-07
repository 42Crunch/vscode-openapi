import styled from "styled-components";
import { useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import PlainDownshiftSelect, { SelectOption } from "../DownshiftSelect";

export default function DownshiftSelect<T>({
  name,
  options,
  label,
  description,
  placeholder,
}: {
  name: string;
  options: SelectOption<T>[];
  label: string;
  description?: string;
  placeholder?: string;
}) {
  const { field } = useController({
    name,
  });

  return (
    <Container>
      <div className="label">{label}</div>
      <PlainDownshiftSelect
        placeholder={placeholder}
        options={options}
        selected={field.value}
        onSelectedItemChange={(item) => {
          if (item) {
            field.onChange(item.value);
          }
        }}
      />
    </Container>
  );
}

const Container = styled.div`
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;
  &:focus-within {
    border: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  > div.label {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
`;
