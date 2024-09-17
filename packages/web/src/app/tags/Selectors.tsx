import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { SearchSelector, SearchSpan, SelectOption } from "./SearchSelector";
import {
  ApiResponseEntry,
  Category,
  CollectionResponseEntry,
  ResponseEntry,
  Tag,
  TagResponseEntry,
} from "./types";
import Tags from "../../icons/Tags";

export function CollectionOrApiSearchSelector({
  type,
  options,
  onItemSelected,
}: {
  type: "collection" | "api";
  options: SelectOption<ResponseEntry>[];
  onItemSelected: (item: SelectOption<ResponseEntry>) => void;
}) {
  return (
    <SearchSelector
      options={options}
      placeholder={(type === "collection" ? "Collection" : "API") + " name or UUID"}
      keepOpen={false}
      filter={(
        items: SelectOption<ResponseEntry>[],
        inputValue: string
      ): SelectOption<ResponseEntry>[] => {
        const searchValue = inputValue.toLowerCase();
        return items.filter((item) => {
          return (
            item.value.desc.name.toLocaleLowerCase().includes(searchValue) ||
            item.value.desc.id.toLocaleLowerCase().includes(searchValue)
          );
        });
      }}
      renderer={(item: SelectOption<ResponseEntry>, index: number, inputValue: string) => {
        return (
          <>
            <SearchSpan value={item.label} searchValue={inputValue}></SearchSpan>
            <CategoryNoteSpan>
              <SearchSpan
                value={`UUID: ${item.value.desc.id}`}
                searchValue={inputValue}
              ></SearchSpan>
            </CategoryNoteSpan>

            {type === "api" && (item.value as ApiResponseEntry).tags.length > 0 && (
              <HeaderOptionContainerTagInfo>
                {(item.value as ApiResponseEntry).tags.length > 0 && <Tags />}
                {(item.value as ApiResponseEntry).tags.map(
                  (tagItem: TagResponseEntry, tagItemIndex: number) => {
                    return (
                      <HeaderOptionTagSpan key={`api-tag-${tagItemIndex}`}>
                        {tagItem.categoryName}: {tagItem.tagName}
                      </HeaderOptionTagSpan>
                    );
                  }
                )}
              </HeaderOptionContainerTagInfo>
            )}
            <CategorySeparator />
          </>
        );
      }}
      onItemSelected={onItemSelected}
    />
  );
}

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
              {item.value.tags
                .filter((tag) => isCategoryOrTagVisible(item.value, tag, inputValue))
                .map((tag, tagIndex) => {
                  if (item.value.multipleChoicesAllowed) {
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
                  } else {
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
                  }
                })}
            </CategoryTagsContainer>
            <CategorySeparator />
          </>
        );
      }}
      onItemSelected={(item: SelectOption<Category>) => {}}
    />
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
      <SearchSpan value={tag.tagName} searchValue={inputValue}></SearchSpan>
    </label>
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
    <label style={{ paddingLeft: `${tag.onlyAdminCanTag ? "17px" : "0px"}` }}>
      {!tag.onlyAdminCanTag && (
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
      )}
      <SearchSpan value={tag.tagName} searchValue={inputValue}></SearchSpan>
    </label>
  );
}

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

const HeaderOptionContainerTagInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  > svg {
    margin-left: 3px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const HeaderOptionTagSpan = styled.div`
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
  padding: 3px;
`;
