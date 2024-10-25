import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { Category, Tag } from "../../features/http-client/platform-api";
import { Check, Circle } from "../../icons";
import {
  Indicator as CheckIndicator,
  Container,
  MediumCheckboxRoot,
} from "../../new-components/Checkbox";
import { Group, Item, Option, Indicator as RadioIndicator } from "../../new-components/RadioGroup";
import { SearchSelector, SearchSpan, SelectOption } from "./SearchSelector";

export function TagsSelector({
  categories,
  selectedTagIds,
  onTagSelected,
}: {
  categories: Category[] | undefined;
  selectedTagIds: Set<string>;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  const options: SelectOption<Category>[] = [];
  if (categories) {
    // Move not selectable tags down the list
    categories.sort((a, b) => (a.onlyAdminCanTag ? 1 : 0) - (b.onlyAdminCanTag ? 1 : 0));
    categories.forEach((item) =>
      options.push({
        id: item.categoryId,
        value: item,
        label: item.categoryId,
      })
    );
  }
  return (
    <SearchSelector
      options={options}
      placeholder="Tag or category name"
      keepOpen={true}
      applyHoverCss={false}
      filter={(items: SelectOption<Category>[], inputValue: string): SelectOption<Category>[] => {
        const searchValue = inputValue.toLowerCase();
        return items.filter((category) => {
          return isCategoryVisible(category.value, searchValue);
        });
      }}
      renderer={(item: SelectOption<Category>, index: number, inputValue: string) => {
        return (
          <>
            <CategorySpan>
              <SearchSpan value={item.value.categoryName} searchValue={inputValue}></SearchSpan>
            </CategorySpan>
            {item.value.tags.length > 0 &&
              item.value.multipleChoicesAllowed &&
              !item.value.onlyAdminCanTag && (
                <CategoryNoteSpan>Multiple choices are allowed</CategoryNoteSpan>
              )}
            {item.value.onlyAdminCanTag && (
              <CategoryWarningNoteSpan>Only admin can tag</CategoryWarningNoteSpan>
            )}
            {!item.value.onlyAdminCanTag && (
              <CategoryTagsContainer key={`${item.value.categoryId}${index}`}>
                {!item.value.multipleChoicesAllowed && (
                  <TagRadioButtonGroup
                    value={getRadioGroupDefaultValue(item.value, selectedTagIds)}
                  >
                    {item.value.tags
                      .filter((tag) => isCategoryOrTagVisible(item.value, tag, inputValue))
                      .map((tag, tagIndex) => {
                        return (
                          <TagRadioButton
                            key={`${tag.tagId}${tagIndex}`}
                            category={item.value}
                            tag={tag}
                            checked={selectedTagIds.has(tag.tagId)}
                            inputValue={inputValue}
                            onTagSelected={onTagSelected}
                          ></TagRadioButton>
                        );
                      })}
                  </TagRadioButtonGroup>
                )}
                {item.value.multipleChoicesAllowed && (
                  <>
                    {item.value.tags
                      .filter((tag) => isCategoryOrTagVisible(item.value, tag, inputValue))
                      .map((tag, tagIndex) => {
                        return (
                          <TagCheckboxButton
                            key={`${tag.tagId}${tagIndex}`}
                            category={item.value}
                            tag={tag}
                            checked={selectedTagIds.has(tag.tagId)}
                            inputValue={inputValue}
                            onTagSelected={onTagSelected}
                          ></TagCheckboxButton>
                        );
                      })}
                  </>
                )}
              </CategoryTagsContainer>
            )}
          </>
        );
      }}
      onItemSelected={(item: SelectOption<Category>) => {}}
    />
  );
}

function getRadioGroupDefaultValue(category: Category, selectedTagIds: Set<string>): string {
  for (const tag of category.tags) {
    if (selectedTagIds.has(tag.tagId)) {
      return tag.tagId;
    }
  }
  return "";
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
  inputValue,
  onTagSelected,
}: {
  category: Category;
  tag: Tag;
  checked: boolean;
  inputValue: string;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  return (
    <CheckboxContainer
      onClick={(e) => {
        if (tag.onlyAdminCanTag) {
          return;
        }
        const button = e.currentTarget.children[0];
        if (button) {
          const isNowChecked = (button as any).dataset.state === "checked";
          onTagSelected(category.categoryId, tag.tagId, !isNowChecked);
        }
      }}
    >
      <MediumCheckboxRoot checked={checked}>
        <CheckIndicator>
          <Check />
        </CheckIndicator>
      </MediumCheckboxRoot>
      <label>
        <SearchSpan value={tag.tagName} searchValue={inputValue}></SearchSpan>
      </label>
    </CheckboxContainer>
  );
}

function TagRadioButton({
  category,
  tag,
  checked,
  inputValue,
  onTagSelected,
}: {
  category: Category;
  tag: Tag;
  checked: boolean;
  inputValue: string;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  return (
    <RadioButtonContainer
      onClick={(e) => {
        if (tag.onlyAdminCanTag) {
          return;
        }
        const button = e.currentTarget.children[0];
        if (button) {
          const isNowChecked = (button as any).dataset.state === "checked";
          onTagSelected(category.categoryId, tag.tagId, !isNowChecked);
        }
      }}
    >
      {!tag.onlyAdminCanTag && (
        <Item value={tag.tagId}>
          <RadioIndicator>
            <Circle />
          </RadioIndicator>
        </Item>
      )}
      <label>
        <SearchSpan value={tag.tagName} searchValue={inputValue}></SearchSpan>
      </label>
    </RadioButtonContainer>
  );
}

const CheckboxContainer = styled(Container)`
  padding: 2px;
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  border-color: var(${ThemeColorVariables.dropdownBackground});
  cursor: pointer;
  & > button {
    cursor: pointer;
  }
  & > label {
    cursor: pointer;
  }
  :hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
    border-color: var(${ThemeColorVariables.border});
  }
`;

const RadioButtonContainer = styled(Option)`
  padding: 2px;
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  border-color: var(${ThemeColorVariables.dropdownBackground});
  cursor: pointer;
  & > button {
    cursor: pointer;
  }
  & > label {
    cursor: pointer;
  }
  :hover {
    background-color: var(${ThemeColorVariables.listHoverBackground});
    border-color: var(${ThemeColorVariables.border});
  }
`;

const TagRadioButtonGroup = styled(Group)`
  flex-direction: column;
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
`;
