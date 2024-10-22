import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { Category, Tag } from "../../features/http-client/platform-api";
import { Check, Circle } from "../../icons";
import {
  Container,
  Indicator as CheckIndicator,
  MediumCheckboxRoot,
} from "../../new-components/Checkbox";
import { Group, Indicator as RadioIndicator, Item, Option } from "../../new-components/RadioGroup";
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
            <CategoryTagsContainer key={`${item.value.categoryId}${index}`}>
              {!item.value.multipleChoicesAllowed && (
                <TagRadioButtonGroup
                  value={getRadioGroupDefaultValue(item.value, selectedTagIds)}
                  onValueChange={(tagId: string) => {
                    const category = item.value;
                    if (category.onlyAdminCanTag) {
                      return;
                    }
                    // Last argument is always true as this hadler
                    // is called only if radio button gets selected
                    onTagSelected(category.categoryId, tagId, true);
                  }}
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
    <Container>
      <MediumCheckboxRoot
        checked={checked}
        onCheckedChange={(checked) => {
          if (typeof checked === "boolean") {
            onTagSelected(category.categoryId, tag.tagId, checked);
          }
        }}
      >
        <CheckIndicator>
          <Check />
        </CheckIndicator>
      </MediumCheckboxRoot>
      <label style={{ paddingLeft: `${tag.onlyAdminCanTag ? "20px" : "0px"}` }}>
        <SearchSpan value={tag.tagName} searchValue={inputValue}></SearchSpan>
      </label>
    </Container>
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
    <Option>
      {!tag.onlyAdminCanTag && (
        <Item value={tag.tagId}>
          <RadioIndicator>
            <Circle
              // Dirty workaround, but we have to catch click events on the svg element as
              // radix radio group supports neither toggling nor unclick event handling
              onClick={(e) => {
                const mySpan = e.currentTarget.parentElement;
                if (mySpan && mySpan.tagName === "SPAN") {
                  const checked = mySpan.dataset.state === "checked";
                  if (checked && !category.onlyAdminCanTag) {
                    // This call will make getRadioGroupDefaultValue return empty value implicitly
                    // Empty default value for the radio group is interpreted as nothing is selected
                    // Thus if a user clicks on the same radio button again, it fires onValueChange event and toggle
                    onTagSelected(category.categoryId, tag.tagId, false);
                  }
                }
              }}
            />
          </RadioIndicator>
        </Item>
      )}
      <label style={{ paddingLeft: `${tag.onlyAdminCanTag ? "20px" : "0px"}` }}>
        <SearchSpan value={tag.tagName} searchValue={inputValue}></SearchSpan>
      </label>
    </Option>
  );
}

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
  padding-bottom: 15px;
`;
