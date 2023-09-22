import styled from "styled-components";

import { useFormContext, useController } from "react-hook-form";
import { useCombobox } from "downshift";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";
import { ArrowUpRightFromSquare } from "../../../../icons";
import { useAppDispatch } from "../../store";
import { goTo } from "../../../../features/router/slice";

export function CredentialNameField({
  names,
  value,
  placeholder,
  onChange,
}: {
  names: string[];
  value: string;
  placeholder: string;
  onChange: (value: string | undefined) => void;
}) {
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState(undefined as string | undefined);
  const [filteredNames, setFilteredNames] = useState(names);

  useEffect(() => {
    if (filter === undefined) {
      setFilteredNames(names);
    } else {
      setFilteredNames(names.filter((item) => item.toLowerCase().includes(filter.toLowerCase())));
    }
  }, [filter, names]);

  const { isOpen, getMenuProps, getInputProps, getItemProps } = useCombobox({
    initialInputValue: value,
    items: filteredNames,
    onInputValueChange: ({ inputValue }) => {
      setFilter(inputValue);
      if (inputValue && names.includes(inputValue)) {
        onChange(inputValue);
      } else {
        onChange(undefined);
      }
    },
  });

  return (
    <>
      <Input {...getInputProps()} placeholder={placeholder} />
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
          {isOpen && (
            <Manage
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(goTo(["auth"]));
              }}
            >
              Manage authentication <ArrowUpRightFromSquare />
            </Manage>
          )}
        </DropdownList>
      </Dropdown>
    </>
  );
}

const Input = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.foreground});
  padding: 4px;
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
