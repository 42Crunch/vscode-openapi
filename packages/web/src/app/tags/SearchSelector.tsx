import { ThemeColorVariables } from "@xliic/common/theme";
import { useCombobox, useMultipleSelection } from "downshift";
import React from "react";
import styled from "styled-components";
import { AngleDown } from "../../icons";

export type SelectOption<T> = {
  id: string;
  value: T;
  label: string;
};

export function SearchSelector<T>({
  options,
  placeholder,
  keepOpen,
  applyHoverCss,
  filter,
  renderer,
  onItemSelected,
}: {
  options: SelectOption<T>[];
  placeholder: string;
  keepOpen: boolean;
  applyHoverCss: boolean;
  filter: (items: SelectOption<T>[], inputValue: string) => SelectOption<T>[];
  renderer: (item: SelectOption<T>, index: number, inputValue: string) => JSX.Element;
  onItemSelected: (item: SelectOption<T>) => void;
}) {
  const [inputValue, setInputValue] = React.useState("");

  const items = React.useMemo(() => filter(options, inputValue), [options, inputValue]);
  const { getDropdownProps } = useMultipleSelection({
    selectedItems: options,
  });

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, getItemProps } = useCombobox({
    items,
    itemToString(item) {
      return item ? item.label : "null";
    },
    inputValue,
    stateReducer(state, actionAndChanges) {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: keepOpen,
          };
        default:
          return changes;
      }
    },
    onStateChange({ inputValue: newInputValue, type, selectedItem: newSelectedItem }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (newSelectedItem) {
            onItemSelected(newSelectedItem);
            if (!keepOpen) {
              setInputValue("");
            }
          }
          break;
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(newInputValue || "");
          break;
        default:
          break;
      }
    },
  });
  const buttonProps = getToggleButtonProps();
  delete buttonProps.ref;
  const DownShiftList = applyHoverCss ? DropDownList : DropDownListDefault;
  return (
    <MainComboboxContainer>
      <DownShiftContainer>
        <DownShiftInput
          placeholder={placeholder}
          {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
        />
        <AngleDown {...buttonProps} />
      </DownShiftContainer>
      <DownShiftList {...getMenuProps()} isOpen={isOpen}>
        {isOpen &&
          items.map((item, index) => (
            <DropDownListElement key={`li-${index}`} {...getItemProps({ item, index })}>
              {renderer(item, index, inputValue)}
            </DropDownListElement>
          ))}
      </DownShiftList>
    </MainComboboxContainer>
  );
}

export function SearchSpan({ value, searchValue }: { value: string; searchValue: string }) {
  if (!searchValue || !value) {
    return <span>{value}</span>;
  }
  let i = -1;
  let j = 0;
  const valueLc = value.toLowerCase();
  const searchValueLc = searchValue.toLocaleLowerCase();
  const chunks: { text: string; mark: boolean }[] = [];
  while ((i = valueLc.indexOf(searchValueLc, i + 1)) != -1) {
    chunks.push({ text: value.substring(j, i), mark: false });
    j = i + searchValueLc.length;
    chunks.push({ text: value.substring(i, j), mark: true });
  }
  chunks.push({ text: value.substring(j), mark: false });
  return (
    <span>
      {chunks.map((chunk, index) => {
        if (chunk.mark) {
          return <SearchMark key={index}>{chunk.text}</SearchMark>;
        } else {
          return chunk.text;
        }
      })}
    </span>
  );
}

const SearchMark = styled.mark`
  font-weight: bold;
  background-color: #cca700;
  border-radius: 3px;
  border: 1px solid #cca700;
  opacity: 0.5;
`;

const MainComboboxContainer = styled.div`
  position: relative;
`;

const DownShiftContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  > svg {
    margin-left: 3px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const DownShiftInput = styled.input`
  min-width: 540px;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 3px;
  border: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.inputForeground});
  height: 25px;
  cursor: pointer;
`;

const DropDownListDefault = styled.ul`
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  margin: 0;
  list-style: none;
  padding-inline-start: 1px;
  max-height: 400px;
  overflow-y: auto;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  color: var(${ThemeColorVariables.dropdownForeground});

  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen &&
    `
    border: 1px solid var(${ThemeColorVariables.dropdownBorder});
    padding: 4px;
  `}

  & > li {
    padding: 8px 4px;
  }

  & > li[aria-disabled="true"] {
    color: var(${ThemeColorVariables.disabledForeground});
  }

  & > li[aria-disabled="true"]:hover {
    background-color: transparent;
  }
`;

const DropDownList = styled(DropDownListDefault)`
  & > li {
    border-width: 1px;
    border-style: solid;
    border-radius: 3px;
    border-color: var(${ThemeColorVariables.dropdownBackground});
    cursor: pointer;
  }

  & > li:hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
    border-color: var(${ThemeColorVariables.border});
  }
`;

const DropDownListElement = styled.li`
  display: flex;
  gap: 5px;
  flex-direction: column;
`;
