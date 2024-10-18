import styled from "styled-components";
import React from "react";

import { ThemeColorVariables } from "@xliic/common/theme";
import { TagData, TagEntry } from "@xliic/common/tags";

import { useAppDispatch } from "./store";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
  TopDescription,
} from "../../components/CollapsibleCard";
import { ErrorBanner } from "../../components/Banner";
import {
  useGetCategoriesQuery,
  useGetTagsQuery,
  Category,
  CategoryResponseEntry,
  Tag,
  TagResponseEntry,
} from "../../features/http-client/platform-api";
import { saveTags } from "./slice";
import { TagsSelector } from "./Selectors";

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
  } = useGetCategoriesQuery();
  const { data: tagList, error: errorTags, isLoading: isLoadingTags } = useGetTagsQuery();
  const loading = isLoadingCategories || isLoadingTags;

  // Get all categories (with tags) to show in combobox
  const categories = getCategories(categoryList || [], tagList || []);
  const tagIdToCategoryMap: Record<string, Category> = {};
  categories.forEach((category) =>
    category.tags.forEach((tag) => (tagIdToCategoryMap[tag.tagId] = category))
  );
  // Keep all tag selections in local state
  const initSelectedTagIds = new Set<string>();
  // todo better for type
  if (tagData && tagData[targetFileName] && Array.isArray(tagData[targetFileName])) {
    for (const tagEntry of tagData[targetFileName]) {
      initSelectedTagIds.add(tagEntry.tagId);
    }
  }
  const dispatch = useAppDispatch();
  const [selectedTagIds, setSelectedTagIds] = React.useState(initSelectedTagIds);

  return (
    <div>
      <HeaderContainer>
        <Header>
          {loading && <HeaderSpan>Loading data from the server...</HeaderSpan>}
          {!loading && (
            <HeaderSelectionSummary
              targetFileName={targetFileName}
              categories={categories}
              selectedTagIds={selectedTagIds}
            />
          )}
          {!loading && (
            <TagsSelector
              categories={categories}
              selectedTagIds={selectedTagIds}
              onTagSelected={(categoryId: string, tagId: string, selected: boolean): void => {
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
                  newSelectedTagIds.delete(tagId);
                }
                setSelectedTagIds(newSelectedTagIds);
                dispatch(saveTags(getTagDataToSave(targetFileName, categories, newSelectedTagIds)));
              }}
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
      <SelectionsContainer categories={categories} selectedTagIds={selectedTagIds} />
    </div>
  );
}

function HeaderSelectionSummary({
  targetFileName,
  categories,
  selectedTagIds,
}: {
  targetFileName: string;
  categories: Category[];
  selectedTagIds: Set<string>;
}) {
  let selCategoriesCount = 0;
  for (const category of categories) {
    for (const tag of category.tags) {
      if (selectedTagIds.has(tag.tagId)) {
        selCategoriesCount += 1;
        break;
      }
    }
  }
  const selTagsCount = selectedTagIds.size;
  return <HeaderSpan>{selTagsCount} tags selected</HeaderSpan>;
}

function SelectionsContainer({
  categories,
  selectedTagIds,
}: {
  categories: Category[];
  selectedTagIds: Set<string>;
}) {
  return (
    <Container>
      {getSelectedCateries(categories, selectedTagIds).map((item, index) => (
        <CollapsibleCard key={`card-${item.categoryId}`}>
          <TopDescription>
            <TopDescriptionContainer>
              <TopDescriptionName>{item.categoryName}</TopDescriptionName>
              <TopDescriptionCounter>
                {getSelectedTags(item, selectedTagIds).length}
              </TopDescriptionCounter>
            </TopDescriptionContainer>
          </TopDescription>
          <CategoryBottomDescription>{`Description: ${item.categoryDescription}`}</CategoryBottomDescription>
          <CardTagsContainer>
            {getSelectedTags(item, selectedTagIds).map((item2, index) => (
              <TagBottomItemContainer key={`bottom-item-${item2.tagId}`}>
                <TagBottomItem>{item2.tagName}</TagBottomItem>
                <TagBottomDescription>{item2.tagDescription}</TagBottomDescription>
              </TagBottomItemContainer>
            ))}
          </CardTagsContainer>
        </CollapsibleCard>
      ))}
    </Container>
  );
}

function getSelectedCateries(categories: Category[], selectedTagIds: Set<string>): Category[] {
  return categories.filter((category) => {
    for (const tag of category.tags) {
      if (selectedTagIds.has(tag.tagId)) {
        return true;
      }
    }
    return false;
  });
}

function getSelectedTags(category: Category, selectedTagIds: Set<string>): Tag[] {
  return category.tags.filter((tag) => {
    return selectedTagIds.has(tag.tagId);
  });
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
        tagEntries.push({ tagId: tag.tagId, tagName: tag.tagName });
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
`;

const CardTagsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  padding-left: 25px;
`;

const TopDescriptionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const TopDescriptionName = styled.div`
  padding-right: 10px;
`;

const TopDescriptionCounter = styled.div`
  background-color: var(${ThemeColorVariables.badgeBackground});
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  color: var(${ThemeColorVariables.badgeForeground});
`;

const CategoryBottomDescription = styled(BottomDescription)`
  font-weight: smaller;
  color: var(${ThemeColorVariables.disabledForeground});
`;

const TagBottomItemContainer = styled(BottomItem)`
  display: flex;
  align-items: flex-start;
  opacity: 1;
  flex-direction: column;
  padding: 5px;
`;

const TagBottomItem = styled.div`
  font-weight: bold;
`;

const TagBottomDescription = styled.div`
  font-weight: smaller;
  color: var(${ThemeColorVariables.disabledForeground});
`;
