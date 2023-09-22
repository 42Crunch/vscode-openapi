import styled from "styled-components";
import { useSelect } from "downshift";
import { useController } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleDown } from "../../../../icons";

export type SelectOption = {
  value: string | number;
  label: string;
};

function itemToString(item: SelectOption | null) {
  return item ? item.label : "";
}

export default function Select({
  name,
  options,
  placeholder,
}: {
  name: string;
  options: SelectOption[];
  placeholder?: string;
}) {
  const { field } = useController({
    name,
    rules: { required: true },
  });

  const selected = getOptionByValue(options, field.value);

  const onSelectedItemChange = (item: SelectOption | null | undefined) => {
    field.onChange(item?.value);
  };

  return (
    <PlainSelect
      options={options}
      placeholder={placeholder}
      selected={selected?.value}
      onSelectedItemChange={onSelectedItemChange}
    />
  );
}

export function PlainSelect({
  options,
  placeholder,
  label,
  selected,
  onSelectedItemChange,
}: {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  selected?: SelectOption["value"];
  onSelectedItemChange: (item: SelectOption | null | undefined) => void;
}) {
  const selectedItem = options.filter((item) => item.value === selected)?.[0];

  const { isOpen, getToggleButtonProps, getMenuProps, getItemProps } = useSelect({
    items: options,
    itemToString,
    selectedItem: selectedItem || null,
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      onSelectedItemChange(newSelectedItem);
    },
  });

  return (
    <Container>
      <SelectContainer>
        <Input {...getToggleButtonProps()}>
          <span>{selectedItem ? selectedItem.label : placeholder ?? ""}</span>
          <AngleDown />
        </Input>
      </SelectContainer>
      <Dropdown {...getMenuProps()} isOpen={isOpen}>
        {isOpen &&
          options.map((item, index) => (
            <li key={`${item.value}${index}`} {...getItemProps({ item, index })}>
              <span>{item.label}</span>
            </li>
          ))}
      </Dropdown>
    </Container>
  );
}

function getOptionByValue(options: SelectOption[], value: string): SelectOption | undefined {
  return options.filter((option) => option.value === value)?.[0];
}

const Container = styled.div`
  position: relative;
`;

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;
  &:focus-within {
    border: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  border: 1px solid transparent;
`;

const Input = styled.div`
  display: flex;
  color: var(${ThemeColorVariables.foreground});
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  > span {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  > svg {
    margin-left: 3px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Dropdown = styled.ul`
  max-height: 350px;
  overflow-y: auto;
  z-index: 1;
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  margin: 0;
  list-style: none;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen &&
    `
    border: 1px solid var(${ThemeColorVariables.dropdownBorder});
    padding: 4px;
  `}

  & > li {
    padding: 4px;
    cursor: pointer;
  }
  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;
