import { useCombobox } from "downshift";
import { useState } from "react";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function AuthorizationTestCombo({
  authorizationTests,
  onSelect,
}: {
  authorizationTests: string[];
  onSelect: (test: string | undefined) => void;
}) {
  const value: string = "";
  const placeholder = "";

  const items: string[] = authorizationTests;

  const [filteredItems, setFilteredItems] = useState(items);

  const { isOpen, getMenuProps, getInputProps, getItemProps, openMenu } = useCombobox({
    initialInputValue: value,
    items: filteredItems,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onSelect(selectedItem);
      }
    },
    onInputValueChange: ({ inputValue }) => {
      setFilteredItems(
        items.filter((item) => {
          return !inputValue || item.toLowerCase().includes(inputValue);
        })
      );
    },
    itemToString: (item) => (item ? item : ""),
  });

  return (
    <Container>
      <Input
        autoFocus
        {...getInputProps({
          onFocus() {
            openMenu();
          },
        })}
        placeholder={placeholder}
        onBlur={(e) => {
          onSelect(undefined);
        }}
      />
      <Dropdown>
        <DropdownList {...getMenuProps()} isOpen={isOpen}>
          {isOpen && (
            <>
              {filteredItems.map((item, index) => {
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
              {filteredItems.length === 0 && <li>No more tests available</li>}
            </>
          )}
        </DropdownList>
      </Dropdown>
    </Container>
  );
}

const Container = styled.div`
  padding: 10px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Input = styled.input`
  background: transparent;
  width: 100%;
  border: none;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
`;

const Dropdown = styled.div`
  position: relative;
  z-index: 1;
`;

const DropdownList = styled.ul`
  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen && `border: 1px solid var(${ThemeColorVariables.dropdownBorder});`}
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});
  position: absolute;
  list-style: none;
  padding: 0;
  margin: 4px 0 0 0;
  width: 100%;
  & > li {
    padding: 4px;
    padding-left: 16px;
  }
  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;
