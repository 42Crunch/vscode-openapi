import styled from "styled-components";
import { useSelect } from "downshift";
import { useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleDown } from "../icons";

export type SelectOption = {
  value: string;
  label: string;
};

function itemToString(item: SelectOption | null) {
  return item ? item.label : "";
}

export default function Select({
  name,
  options,
  placeholder,
  label,
}: {
  name: string;
  options: SelectOption[];
  placeholder?: string;
  label: string;
}) {
  const { field } = useController({
    name,
    rules: { required: true },
  });

  const { isOpen, getToggleButtonProps, getMenuProps, getItemProps } = useSelect({
    items: options,
    itemToString,
    selectedItem: field.value ?? null,
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      field.onChange(newSelectedItem?.value);
    },
  });

  const selected = getOptionByValue(options, field.value);

  return (
    <Container>
      <div>{label}</div>

      <Input {...getToggleButtonProps()}>
        <span>{selected ? selected.label : placeholder ?? ""}</span>
        <AngleDown />
      </Input>
      <List {...getMenuProps()} isOpen={isOpen}>
        {isOpen &&
          options.map((item, index) => (
            <li key={`${item.value}${index}`} {...getItemProps({ item, index })}>
              <span>{item.label}</span>
            </li>
          ))}
      </List>
    </Container>
  );
}

function getOptionByValue(options: SelectOption[], value: string): SelectOption | undefined {
  return options.filter((option) => option.value === value)?.[0];
}

const Container = styled.div`
  height: 40px;
  position: relative;
  z-index: 1;
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
  > div:first-child {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
`;

const Input = styled.div`
  display: flex;
  color: var(${ThemeColorVariables.foreground});
  align-items: center;
  cursor: pointer;
  > span {
    flex: 1;
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const List = styled.ul`
  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen &&
    `
    border: 1px solid var(${ThemeColorVariables.dropdownBorder});
    padding: 4px;
    margin: 4px 0 0 0;
    `}
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  width: 100%;
  position: absolute;
  list-style: none;

  & > li {
    padding: 4px;
    cursor: pointer;
  }
  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;
