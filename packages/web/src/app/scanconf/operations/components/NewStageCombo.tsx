import styled from "styled-components";
import { useCombobox } from "downshift";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";
import { RequestRef } from "@xliic/common/playbook";

export default function NewStageCombo({
  operationIds,
  requestIds,
  onSelect,
}: {
  operationIds: string[];
  requestIds: string[];
  onSelect: (ref?: RequestRef) => void;
}) {
  const value: string = "";
  const placeholder = "";

  const items: RequestRef[] = [];

  items.push(
    ...operationIds.map(
      (id): RequestRef => ({
        type: "operation",
        id,
      })
    )
  );

  items.push(
    ...requestIds.map(
      (id): RequestRef => ({
        type: "request",
        id,
      })
    )
  );

  const [filteredItems, setFilteredItems] = useState(items);

  const { isOpen, getMenuProps, getInputProps, getItemProps } = useCombobox({
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
          return !inputValue || item.id.toLowerCase().includes(inputValue);
        })
      );
    },
    itemToString: (item) => (item ? item.id : ""),
  });

  return (
    <Container>
      <Input
        autoFocus
        {...getInputProps()}
        placeholder={placeholder}
        onBlur={(e) => {
          onSelect(undefined);
        }}
      />
      <Dropdown>
        <DropdownList {...getMenuProps()} isOpen={isOpen}>
          {isOpen && (
            <>
              <Section>Operations</Section>
              {filteredItems.map((item, index) => {
                return item.type === "operation" ? (
                  <li
                    key={`li-${item.type}-${item.id}-${index}`}
                    {...getItemProps({
                      item,
                      index,
                    })}
                  >
                    {item.id}
                  </li>
                ) : null;
              })}
              <Section>Requests</Section>
              {filteredItems.map((item, index) => {
                return item.type === "request" ? (
                  <li
                    key={`li-${item.type}-${item.id}-${index}`}
                    {...getItemProps({
                      item,
                      index,
                    })}
                  >
                    {item.id}
                  </li>
                ) : null;
              })}
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

const Section = styled.div`
  font-weight: 600;
  margin: 4px;
`;
