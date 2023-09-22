import styled from "styled-components";
import { useCombobox } from "downshift";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";
import { RequestRef } from "@xliic/common/playbook";

export default function NewStageCombo({
  operationIds,
  onSelect,
}: {
  operationIds: string[];
  onSelect: (ref?: RequestRef) => void;
}) {
  const value: string = "";
  const placeholder = "";

  const [filter, setFilter] = useState(undefined as string | undefined);
  const [filteredNames, setFilteredNames] = useState(operationIds);

  useEffect(() => {
    if (filter === undefined) {
      setFilteredNames(operationIds);
    } else {
      setFilteredNames(
        operationIds.filter((item) => item.toLowerCase().includes(filter.toLowerCase()))
      );
    }
  }, [filter, operationIds]);

  const { isOpen, getMenuProps, getInputProps, getItemProps } = useCombobox({
    initialInputValue: value,
    items: filteredNames,
    onInputValueChange: ({ inputValue }) => {
      setFilter(inputValue);
      if (inputValue && operationIds.includes(inputValue)) {
        onSelect({ type: "operation", id: inputValue });
      }
    },
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
          {isOpen &&
            filteredNames.map((item, index) => (
              <li
                key={`${item}${index}`}
                {...getItemProps({
                  item,
                  index,
                })}
              >
                {item}
              </li>
            ))}
          {/* {isOpen && (
            <Manage
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                //dispatch(showAuthWindow());
              }}
            >
              Manage authentication <ArrowUpRightFromSquare />
            </Manage>
          )} */}
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
  }
  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
  }
`;

const Manage = styled.li`
  color: var(${ThemeColorVariables.linkForeground});
  &:hover {
    color: var(${ThemeColorVariables.linkActiveForeground});
  }
  cursor: pointer;
  & > svg {
    width: 10px;
    height: 10px;
  }
`;
