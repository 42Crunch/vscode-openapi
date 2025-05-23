import styled from "styled-components";
import { useCombobox } from "downshift";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";

export default function DownshiftCombo<T>({
  options,
  placeholder,
  selected,
  onSelectedItemChange,
}: {
  options: string[];
  placeholder?: string;
  label?: string;
  selected?: string;
  onSelectedItemChange: (item: string | null | undefined) => void;
}) {
  const [filter, setFilter] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    setFilteredOptions(
      options.filter((item) => {
        return filter === "" || item.toLowerCase().includes(filter.toLowerCase());
      })
    );
  }, [filter, options]);

  const { isOpen, getMenuProps, getInputProps, getItemProps } = useCombobox({
    initialInputValue: selected,
    items: filteredOptions,
    onInputValueChange: ({ inputValue }) => {
      onSelectedItemChange(inputValue);
      if (inputValue !== undefined) {
        setFilter(inputValue);
      } else {
        setFilter("");
      }
    },
    itemToString: (item) => (item ? item : ""),
  });

  return (
    <Container>
      <Input {...getInputProps()} placeholder={placeholder} />
      <Dropdown $visible={isOpen && filteredOptions.length > 0}>
        <DropdownList {...getMenuProps()}>
          {filteredOptions.map((item, index) => {
            return (
              <li
                key={`li-${index}`}
                {...getItemProps({
                  item,
                  index,
                })}
              >
                {item}
              </li>
            );
          })}
        </DropdownList>
      </Dropdown>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  &:focus-within {
    border: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  border: 1px solid transparent;
`;

const Input = styled.input`
  background: transparent;
  border: none;
  color: var(${ThemeColorVariables.foreground});
  padding: 4px;
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
  &:focus {
    outline: none;
  }
`;

const Dropdown = styled.div<{ $visible: boolean }>`
  position: relative;
  z-index: 1;
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
`;

const DropdownList = styled.ul`
  border: 1px solid var(${ThemeColorVariables.dropdownBorder});
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  position: absolute;
  overflow-y: auto;
  max-height: 200px;
  list-style: none;
  padding: 0;
  margin: 4px 0 0 0;
  width: 100%;
  & > li {
    padding: 4px;
  }
  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;
