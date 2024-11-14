import React from "react";
import styled from "styled-components";

import { TagData, TagEntry } from "@xliic/common/tags";
import { ThemeColorVariables } from "@xliic/common/theme";

import { ErrorBanner } from "../../components/Banner";
import {
  Category,
  CategoryResponseEntry,
  refreshOptions,
  TagResponseEntry,
  useGetCategoriesQuery,
  useGetTagsQuery,
} from "../../features/http-client/platform-api";
import { TrashCan } from "../../icons";
import {
  HeaderOptionContainer,
  HeaderOptionContainerAction,
  HeaderOptionContainerInfo,
  HeaderOptionNoteSpan,
  HeaderOptionRemoverSpan,
  HeaderOptionSpan,
} from "./ApiPanel";
import { TagsSelector } from "./TagsSelector";
import { saveTags } from "./slice";
import { useAppDispatch } from "./store";

export function TagsPanel({
  targetFileName,
  tagData,
}: {
  targetFileName: string;
  tagData: TagData;
}) {
  const {
    data: categoryList,
    error: errorCategories,
    isLoading: isLoadingCategories,
  } = useGetCategoriesQuery(undefined, refreshOptions);
  const {
    data: tagList,
    error: errorTags,
    isLoading: isLoadingTags,
  } = useGetTagsQuery(undefined, refreshOptions);
  const loading = isLoadingCategories || isLoadingTags;

  // Get all categories (with tags) to show in combobox
  const categories = getCategories(categoryList || [], tagList || []);
  // Keep all tag selections in local state
  const initSelectedTagIds = new Set<string>();
  const tagEntries = tagData[targetFileName];
  if (tagData && tagEntries && Array.isArray(tagEntries)) {
    for (const tagEntry of tagEntries) {
      initSelectedTagIds.add(tagEntry.tagId);
    }
  }
  const dispatch = useAppDispatch();
  const [selectedTagIds, setSelectedTagIds] = React.useState(initSelectedTagIds);

  const onTagSelected = function (categoryId: string, tagId: string, selected: boolean): void {
    const newSelectedTagIds = new Set<string>(selectedTagIds);
    if (selected) {
      newSelectedTagIds.add(tagId);
      for (const category of categories) {
        if (category.categoryId === categoryId && !category.multipleChoicesAllowed) {
          for (const tag of category.tags) {
            if (tag.tagId !== tagId) {
              newSelectedTagIds.delete(tag.tagId);
            }
          }
          break;
        }
      }
    } else {
      if (tagId === "") {
        // User removes all tags not existing on the server
        const loadedTagIds = new Set<string>();
        categories.forEach((category) =>
          category.tags.forEach((tag) => loadedTagIds.add(tag.tagId))
        );
        for (const selTagId of selectedTagIds) {
          if (!loadedTagIds.has(selTagId)) {
            newSelectedTagIds.delete(selTagId);
          }
        }
      } else {
        newSelectedTagIds.delete(tagId);
      }
    }
    setSelectedTagIds(newSelectedTagIds);
    dispatch(saveTags(getTagDataToSave(targetFileName, categories, newSelectedTagIds)));
  };

  return (
    <div>
      <HeaderContainer>
        <Header>
          {loading && <HeaderSpan>Loading data from the server...</HeaderSpan>}
          {!loading && <HeaderSelectionSummary selectedTagIds={selectedTagIds} />}
          {!loading && (
            <TagsSelector
              categories={categories}
              selectedTagIds={selectedTagIds}
              onTagSelected={onTagSelected}
            />
          )}
        </Header>
        <HeaderError>
          {errorCategories && (
            <ErrorBanner message="Failed to load categories">
              HTTPError: Response code {errorCategories.code} ({errorCategories.message})
            </ErrorBanner>
          )}
          {errorTags && (
            <ErrorBanner message="Failed to load tags">
              HTTPError: Response code {errorTags.code} ({errorTags.message})
            </ErrorBanner>
          )}
        </HeaderError>
      </HeaderContainer>
      {!loading && !(errorTags || errorCategories) && Array.isArray(tagEntries) && (
        <SelectionsContainer
          tagEntries={tagEntries}
          categories={categories}
          selectedTagIds={selectedTagIds}
          onTagSelected={onTagSelected}
        />
      )}
    </div>
  );
}

function HeaderSelectionSummary({ selectedTagIds }: { selectedTagIds: Set<string> }) {
  const selTagsCount = selectedTagIds.size;
  return <HeaderSpan>{selTagsCount} tags selected</HeaderSpan>;
}

function SelectionsContainer({
  tagEntries,
  categories,
  selectedTagIds,
  onTagSelected,
}: {
  tagEntries: TagEntry[];
  categories: Category[];
  selectedTagIds: Set<string>;
  onTagSelected: (categoryId: string, tagId: string, selected: boolean) => void;
}) {
  return (
    <Container>
      {getSelectedTags(tagEntries, categories, selectedTagIds).map((item, index) => (
        <HeaderOptionContainer key={`${item.tagId}${index}`} isLoaded={item.loaded}>
          <HeaderOptionContainerInfo>
            <HeaderOptionSpan>
              {item.loaded
                ? item.fullTagName
                : "These tags do not exist on the server, please remove them"}
            </HeaderOptionSpan>
            {item.loaded && <HeaderOptionNoteSpan>UUID: {item.tagId}</HeaderOptionNoteSpan>}
            {!item.loaded && <HeaderOptionNoteSpan>{item.fullTagName}</HeaderOptionNoteSpan>}
          </HeaderOptionContainerInfo>
          <HeaderOptionContainerAction>
            <HeaderOptionRemoverSpan
              onClick={(e) => {
                e.stopPropagation();
                onTagSelected(item.categoryId, item.tagId, false);
              }}
            >
              <TrashCan />
            </HeaderOptionRemoverSpan>
          </HeaderOptionContainerAction>
        </HeaderOptionContainer>
      ))}
    </Container>
  );
}

function getSelectedTags(
  tagEntries: TagEntry[],
  categories: Category[],
  selectedTagIds: Set<string>
): { categoryId: string; tagId: string; fullTagName: string; loaded: boolean }[] {
  const res = [];
  const loadedTagIds = new Set<string>();
  for (const category of categories) {
    for (const tag of category.tags) {
      loadedTagIds.add(tag.tagId);
      if (selectedTagIds.has(tag.tagId)) {
        res.push({
          categoryId: category.categoryId,
          tagId: tag.tagId,
          fullTagName: category.categoryName + ": " + tag.tagName,
          loaded: true,
        });
      }
    }
  }
  const deadFullTagNames = [];
  const idToEntry = new Map<string, TagEntry>();
  tagEntries.forEach((tagEntry) => idToEntry.set(tagEntry.tagId, tagEntry));
  for (const selTagId of selectedTagIds) {
    if (!loadedTagIds.has(selTagId)) {
      const myTagEntry = idToEntry.get(selTagId);
      if (myTagEntry) {
        deadFullTagNames.push(myTagEntry.categoryName + ": " + myTagEntry.tagName);
      }
    }
  }
  if (deadFullTagNames.length > 0) {
    res.push({
      categoryId: "",
      tagId: "",
      fullTagName: deadFullTagNames.join(", "),
      loaded: false,
    });
  }
  return res;
}

function getTagDataToSave(
  targetFileName: string,
  categories: Category[],
  selectedTagIds: Set<string>
): TagData {
  const tagData: TagData = {};
  const tagEntries: TagEntry[] = [];
  for (const category of categories) {
    for (const tag of category.tags) {
      if (selectedTagIds.has(tag.tagId)) {
        tagEntries.push({
          tagId: tag.tagId,
          tagName: tag.tagName,
          categoryName: category.categoryName,
        });
      }
    }
  }
  tagData[targetFileName] = tagEntries.length > 0 ? tagEntries : null;
  return tagData;
}

function getCategories(
  categoryList: CategoryResponseEntry[],
  tagList: TagResponseEntry[]
): Category[] {
  {
    const categories: Category[] = [];
    const categoryIdsMap: { [key: string]: Category } = {};
    for (const categoryEntry of categoryList) {
      const category = {
        categoryId: categoryEntry.id,
        categoryName: categoryEntry.name,
        categoryDescription: categoryEntry.description,
        onlyAdminCanTag: categoryEntry.onlyAdminCanTag,
        multipleChoicesAllowed: !categoryEntry.isExclusive,
        tags: [],
      };
      categories.push(category);
      categoryIdsMap[category.categoryId] = category;
    }
    for (const tagEntry of tagList) {
      const tagCategory = categoryIdsMap[tagEntry.categoryId];
      if (tagCategory) {
        const tag = {
          tagId: tagEntry.tagId,
          tagName: tagEntry.tagName,
          tagDescription: tagEntry.tagDescription,
          onlyAdminCanTag: tagCategory.onlyAdminCanTag,
        };
        tagCategory.tags.push(tag);
      }
    }
    return categories.filter((category) => category.tags.length > 0);
  }
}

export const Title = styled.div`
  font-weight: 700;
  margin-bottom: 16px;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  background-color: var(${ThemeColorVariables.computedOne});
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const HeaderError = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const HeaderSpan = styled.span`
  font-weight: bold;
`;

const Container = styled.div`
  display: flex;
  align-items: stretch;
  background-color: var(${ThemeColorVariables.computedOne});
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: space-evenly;
  gap: 5px;
`;
