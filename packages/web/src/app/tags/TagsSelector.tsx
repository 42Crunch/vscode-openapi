import { useMultipleSelection, useCombobox } from "downshift";
import React from "react";
import { Category, Tag } from "./types";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

export function TagsSelector({
  categories,
  selectedTagIds,
  onTagSelected,
}: {
  categories: Category[];
  selectedTagIds: Set<string>;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  const [inputValue, setInputValue] = React.useState("");

  function getFilteredItems(items: Category[], inputValue: string): Category[] {
    const searchValue = inputValue.toLowerCase();
    return items.filter((category) => {
      return isCategoryVisible(category, searchValue);
    });
  }

  const items = React.useMemo(
    () => getFilteredItems(categories, inputValue),
    [categories, inputValue]
  );
  const { getDropdownProps } = useMultipleSelection({
    selectedItems: categories,
  });

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, getItemProps } = useCombobox({
    items,
    itemToString(item) {
      return item ? item.categoryName : "null";
    },
    inputValue,
    stateReducer(_state, actionAndChanges) {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: true, // keep the menu open after selection.
          };
        default:
          return changes;
      }
    },
    onStateChange({ inputValue: newInputValue, type }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
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
          placeholder="Tag or category name"
          {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
        />
        <DownShiftButton type="button" {...getToggleButtonProps()}>
          &#8595;
        </DownShiftButton>
      </DownShiftContainer>
      <DropDownList className={` ${!(isOpen && items.length) && "hidden"}`} {...getMenuProps()}>
        {isOpen &&
          items.map((item, index) => (
            <DropDownListElement key={item.categoryId} {...getItemProps({ item, index })}>
              <CategorySpan>{item.categoryName}</CategorySpan>
              {item.tags.length > 0 && item.multipleChoicesAllowed && !item.onlyAdminCanTag && (
                <CategoryNoteSpan>Multiple choices are allowed</CategoryNoteSpan>
              )}
              {item.onlyAdminCanTag && (
                <CategoryWarningNoteSpan>Only admin can tag</CategoryWarningNoteSpan>
              )}
              <CategoryTagsContainer key={`${item.categoryId}${index}`}>
                {item.tags
                  .filter((tag) => isCategoryOrTagVisible(item, tag, inputValue))
                  .map((tag, tagIndex) => {
                    if (item.multipleChoicesAllowed) {
                      return (
                        <TagCheckboxButton
                          key={`${tag.tagId}${tagIndex}`}
                          category={item}
                          tag={tag}
                          checked={selectedTagIds.has(tag.tagId)}
                          onTagSelected={onTagSelected}
                        ></TagCheckboxButton>
                      );
                    } else {
                      return (
                        <TagRadioButton
                          key={`${tag.tagId}${tagIndex}`}
                          category={item}
                          tag={tag}
                          checked={selectedTagIds.has(tag.tagId)}
                          onTagSelected={onTagSelected}
                        ></TagRadioButton>
                      );
                    }
                  })}
              </CategoryTagsContainer>
              <CategorySeparator />
            </DropDownListElement>
          ))}
      </DropDownList>
    </MainComboboxContainer>
  );
}

function isCategoryOrTagVisible(category: Category, tag: Tag, inputValue: string) {
  const searchValue = inputValue.toLowerCase();
  return isCategoryVisible(category, searchValue) || isTagVisible(tag, searchValue);
}

function isCategoryVisible(category: Category, searchValue: string): boolean {
  if (category.categoryName.toLocaleLowerCase().includes(searchValue)) {
    return true;
  }
  for (const tag of category.tags) {
    if (isTagVisible(tag, searchValue)) {
      return true;
    }
  }
  return false;
}

function isTagVisible(tag: Tag, searchValue: string): boolean {
  return tag.tagName.toLocaleLowerCase().includes(searchValue);
}

function TagCheckboxButton({
  category,
  tag,
  checked,
  onTagSelected,
}: {
  category: Category;
  tag: Tag;
  checked: boolean;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  return (
    <label style={{ paddingLeft: `${tag.onlyAdminCanTag ? "17px" : "0px"}` }}>
      {!tag.onlyAdminCanTag && (
        <Input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            onTagSelected(category.categoryId, tag.tagId, e.currentTarget.checked);
          }}
        />
      )}
      {tag.tagName}
    </label>
  );
}

function TagRadioButton({
  category,
  tag,
  checked,
  onTagSelected,
}: {
  category: Category;
  tag: Tag;
  checked: boolean;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  return (
    <label style={{ paddingLeft: `${tag.onlyAdminCanTag ? "17px" : "0px"}` }}>
      <Input
        type="radio"
        checked={checked}
        onChange={(e) => {
          if (category.onlyAdminCanTag) {
            return;
          }
          onTagSelected(category.categoryId, tag.tagId, e.currentTarget.checked);
        }}
        onClick={(e) => {
          if (e.currentTarget.checked && checked && !category.onlyAdminCanTag) {
            onTagSelected(category.categoryId, tag.tagId, false);
          }
        }}
      />
      {tag.tagName}
    </label>
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
`;

const DownShiftInput = styled.input`
  min-width: 540px;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 3px;
  border: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.inputForeground});
  height: 25px;
`;

const DownShiftButton = styled.button`
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  height: 25px;
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  color: var(${ThemeColorVariables.buttonForeground});
  background-color: var(${ThemeColorVariables.buttonBackground});
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
