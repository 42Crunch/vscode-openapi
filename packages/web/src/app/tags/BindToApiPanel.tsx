import { ApiEntry, TagData } from "@xliic/common/tags";
import { ThemeColorVariables } from "@xliic/common/theme";
import React from "react";
import styled from "styled-components";
import { BottomDescription, BottomItem } from "../../components/CollapsibleCard";
import { SearchSelector } from "./SearchSelector";
import { saveTags } from "./slice";
import { useAppDispatch } from "./store";
import { useGetApisFromCollectionQuery, useGetCollectionsQuery } from "./tags-api";
import { SearchableItem } from "./types";

export function BindToApiPanel({
  targetFileName,
  tagData,
}: {
  targetFileName: string;
  tagData: TagData;
}) {
  const dispatch = useAppDispatch();

  const {
    data: collsList,
    error: errorColls,
    isLoading: isLoadingColls,
  } = useGetCollectionsQuery();
  const [collectionItem, setCollectionItem] = React.useState<SearchableItem | undefined>(undefined);
  const [apiItem, setApiItem] = React.useState<SearchableItem | undefined>(undefined);

  return (
    <div>
      <HeaderContainer>
        <Header>
          <HeaderSelector
            isLoading={isLoadingColls}
            isLoadingText="Loading collections from the server..."
            itemTypeText="collection"
            collectionItem={collectionItem}
            onItemRemoved={(item: SearchableItem): void => {
              dispatch(saveTags({ targetFileName: null }));
              setApiItem(undefined);
              setCollectionItem(undefined);
            }}
          />
          {!isLoadingColls && (
            <SearchSelector
              itemsList={
                collsList?.map((collEntry) => ({
                  id: collEntry.desc.id,
                  name: collEntry.desc.name,
                  entry: collEntry,
                })) || []
              }
              onItemSelected={(item: SearchableItem): void => {
                setCollectionItem(item);
              }}
            />
          )}
        </Header>
        {collectionItem && (
          <HeaderForApi
            apiItem={apiItem}
            collectionItem={collectionItem}
            onItemRemoved={(item: SearchableItem): void => {
              setApiItem(undefined);
              dispatch(saveTags({ targetFileName: null }));
            }}
            onItemSelected={(item: SearchableItem): void => {
              setApiItem(item);
              const tagData: TagData = {};
              tagData[targetFileName] = {
                apiId: item.id,
                apiName: item.name,
                collectionName: collectionItem.name,
              } as ApiEntry;
              dispatch(saveTags(tagData));
            }}
          />
        )}
        <HeaderError></HeaderError>
      </HeaderContainer>
    </div>
  );
}

function HeaderSelector({
  isLoading,
  isLoadingText,
  itemTypeText,
  collectionItem,
  onItemRemoved,
}: {
  isLoading: boolean;
  isLoadingText: string;
  itemTypeText: string;
  collectionItem: SearchableItem | undefined;
  onItemRemoved: (item: SearchableItem) => void;
}) {
  return (
    <HeaderHeaderSelectorContainer>
      {isLoading && <HeaderSpan>{isLoadingText}</HeaderSpan>}
      {!isLoading && !collectionItem && <HeaderSpan>Select a {itemTypeText}</HeaderSpan>}
      {!isLoading && collectionItem && (
        <HeaderItem>
          <HeaderSpan>Selected {itemTypeText}</HeaderSpan>
          <HeaderItemSpan>{collectionItem.name}</HeaderItemSpan>
          <HeaderItemRemoverSpan
            onClick={(e) => {
              e.stopPropagation();
              onItemRemoved(collectionItem);
            }}
          >
            &#10005;
          </HeaderItemRemoverSpan>
        </HeaderItem>
      )}
    </HeaderHeaderSelectorContainer>
  );
}

function HeaderForApi({
  apiItem,
  collectionItem,
  onItemRemoved,
  onItemSelected,
}: {
  apiItem: SearchableItem | undefined;
  collectionItem: SearchableItem;
  onItemRemoved: (item: SearchableItem) => void;
  onItemSelected: (item: SearchableItem) => void;
}) {
  const {
    data: apiList,
    error: errorApi,
    isLoading: isLoadingApi,
  } = useGetApisFromCollectionQuery(collectionItem.id);

  return (
    <Header>
      <HeaderSelector
        isLoading={isLoadingApi}
        isLoadingText="Loading APIs from the server..."
        itemTypeText="api"
        collectionItem={apiItem}
        onItemRemoved={onItemRemoved}
      />
      {!isLoadingApi && (
        <SearchSelector
          itemsList={
            apiList?.map((apiEntry) => ({
              id: apiEntry.desc.id,
              name: apiEntry.desc.name,
              entry: apiEntry,
              children: apiEntry.tags.map((tag) => tag.categoryName + ": " + tag.tagName),
            })) || []
          }
          onItemSelected={onItemSelected}
        />
      )}
    </Header>
  );
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
`;

const HeaderError = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const HeaderHeaderSelectorContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 7px;
`;

const HeaderItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const HeaderSpan = styled.span`
  font-weight: bold;
  padding: 15px;
`;

const HeaderItemSpan = styled.span`
  font-weight: bold;
  padding: 3px;
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
`;

const HeaderItemRemoverSpan = styled.span`
  font-weight: bold;
  cursor: pointer;
  padding: 1px;
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
