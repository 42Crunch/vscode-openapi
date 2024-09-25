import { useMultipleSelection, useCombobox } from "downshift";
import React from "react";
import { Category, SearchableItem, Tag } from "./types";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { AngleDown } from "../../icons";

export type SelectOption<T> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export function RootSearchSelector<T>({
  options,
  placeholder,
  filter,
  renderer,
  onItemSelected,
}: {
  options: SelectOption<T>[];
  placeholder: string;
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
            isOpen: false,
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
            setInputValue("");
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

  return (
    <MainComboboxContainer>
      <DownShiftContainer>
        <DownShiftInput
          placeholder={placeholder}
          {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
        />
        <AngleDown {...getToggleButtonProps()} />
      </DownShiftContainer>
      <DropDownList className={`${!(isOpen && items.length) && "hidden"}`} {...getMenuProps()}>
        {isOpen &&
          items.map((item, index) => (
            <DropDownListElement key={`li-${index}`} {...getItemProps({ item, index })}>
              {renderer(item, index, inputValue)}
              {/* <SearchSpan value={item.name} searchValue={inputValue}></SearchSpan>
              <CategoryNoteSpan>UUID: {item.id}</CategoryNoteSpan>
              {item.children && (
                <div>
                  {item.children.map((tagItem, tagItemIndex) => {
                    return <span key={`${item.id}-${tagItemIndex}`}>{tagItem} </span>;
                  })}
                </div>
              )}
              <CategorySeparator /> */}
            </DropDownListElement>
          ))}
      </DropDownList>
    </MainComboboxContainer>
  );
}

function SearchSpan({ value, searchValue }: { value: string; searchValue: string }) {
  if (!searchValue || !value) {
    return <span>{value}</span>;
  }
  let i = -1;
  let j = 0;
  value = value.toLowerCase();
  searchValue = searchValue.toLocaleLowerCase();
  const chunks: { text: string; mark: boolean }[] = [];
  while ((i = value.indexOf(searchValue, i + 1)) != -1) {
    chunks.push({ text: value.substring(j, i), mark: false });
    j = i + searchValue.length;
    chunks.push({ text: value.substring(i, j), mark: true });
  }
  chunks.push({ text: value.substring(j), mark: false });
  return (
    <span>
      {chunks.map((chunk, index) => {
        if (chunk.mark) {
          return <mark key={index}>{chunk.text}</mark>;
        } else {
          return chunk.text;
        }
      })}
    </span>
  );
}

const MainComboboxContainer = styled.div`
  width: 592px;
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

const DropDownList = styled.ul`
  position: absolute;
  width: inherit;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  overflow-y: scroll;
  max-height: 30rem;
  z-index: 10;
  margin-top: 5px;
  padding-inline-start: 1px;
`;

const DropDownListElement = styled.li`
  display: flex;
  gap: 5px;
  flex-direction: column;
  padding-bottom: 0.5rem;
  padding-top: 0.5rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  cursor: pointer;
`;

const CategorySpan = styled.span`
  font-weight: bold;
`;

const CategoryNoteSpan = styled.span`
  font-weight: smaller;
  color: var(${ThemeColorVariables.disabledForeground});
`;

const CategoryWarningNoteSpan = styled.span`
  font-weight: smaller;
  color: var(${ThemeColorVariables.errorForeground});
`;

const CategoryTagsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: 15px;
`;

const CategorySeparator = styled.div`
  height: 1px;
  background-color: var(${ThemeColorVariables.border});
`;

const Input = styled.input`
  accent-color: var(${ThemeColorVariables.checkboxBackground});
`;
