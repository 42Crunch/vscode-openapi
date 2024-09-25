import { ApiEntry, TagData } from "@xliic/common/tags";
import { ThemeColorVariables } from "@xliic/common/theme";
import React from "react";
import styled from "styled-components";
import { BottomDescription, BottomItem } from "../../components/CollapsibleCard";
import { ApiSearchSelector, CollectionSearchSelector } from "./SearchSelector";
import { saveTags } from "./slice";
import { useAppDispatch } from "./store";
import { useGetApisFromCollectionQuery, useGetCollectionsQuery } from "./tags-api";
import { ApiResponseEntry, CollectionResponseEntry, SearchableItem } from "./types";
import { SelectOption } from "./RootSearchSelector";
import { ErrorBanner } from "../../components/Banner";

export function BindToApiPanel({
  targetFileName,
  tagData,
}: {
  targetFileName: string;
  tagData: TagData;
}) {
  const dispatch = useAppDispatch();
  const targetData = tagData[targetFileName];
  const selectedApiId = Array.isArray(targetData) ? undefined : targetData?.apiId;
  const selectedColId = Array.isArray(targetData) ? undefined : targetData?.collectionId;
  const {
    data: collsList,
    error: errorColls,
    isLoading: isLoadingColls,
  } = useGetCollectionsQuery();
  const [collectionId, setCollectionId] = React.useState<string | undefined>(selectedColId);
  const [apiId, setApiId] = React.useState<string | undefined>(undefined);

  const collection = collsList?.filter((c) => c.desc.id === collectionId)[0];

  return (
    <HeaderContainer>
      <div>
        <Header>
          <SelectionStatus
            isLoading={isLoadingColls}
            isLoadingText="Loading collections from the server..."
            itemTypeText="collection"
            item={collection}
            onItemRemoved={(item: CollectionResponseEntry): void => {
              if (apiId) {
                dispatch(saveTags({ [targetFileName]: null }));
              }
              setApiId(undefined);
              setCollectionId(undefined);
            }}
          />
          {!isLoadingColls && (
            <CollectionSearchSelector
              collections={collsList}
              onItemSelected={(item: SelectOption<CollectionResponseEntry>): void => {
                setCollectionId(item.value.desc.id);
              }}
            />
          )}
        </Header>
        <HeaderError>
          {errorColls && (
            <ErrorBanner message="Failed to load collections">
              HTTPError: Response code {errorColls.code} ({errorColls.message})
            </ErrorBanner>
          )}
        </HeaderError>
      </div>

      {collection && (
        <ApiSelectionPanel
          apiId={selectedApiId}
          collection={collection}
          onItemRemoved={(item: ApiResponseEntry): void => {
            setApiId(undefined);
            dispatch(saveTags({ [targetFileName]: null }));
          }}
          onItemSelected={(item: SelectOption<ApiResponseEntry>): void => {
            setApiId(item.value.desc.id);
            const tagData: TagData = {};
            tagData[targetFileName] = {
              apiId: item.value.desc.id,
              apiName: item.value.desc.name,
              collectionId: collection.desc.id,
              collectionName: collection.desc.name,
            } as ApiEntry;
            dispatch(saveTags(tagData));
          }}
        />
      )}
    </HeaderContainer>
  );
}

function SelectionStatus<T>({
  isLoading,
  isLoadingText,
  itemTypeText,
  item,
  onItemRemoved,
}: {
  isLoading: boolean;
  isLoadingText: string;
  itemTypeText: string;
  item: T | undefined;
  onItemRemoved: (item: T) => void;
}) {
  return (
    <HeaderHeaderSelectorContainer>
      {isLoading && <HeaderSpan>{isLoadingText}</HeaderSpan>}
      {!isLoading && !item && <HeaderSpan>Select a {itemTypeText}</HeaderSpan>}
      {!isLoading && item && (
        <HeaderItem>
          <HeaderSpan>Selected {itemTypeText}</HeaderSpan>
          <HeaderItemSpan>{(item as any).desc.name}</HeaderItemSpan>
          <HeaderItemRemoverSpan
            onClick={(e) => {
              e.stopPropagation();
              onItemRemoved(item);
            }}
          >
            &#10005;
          </HeaderItemRemoverSpan>
        </HeaderItem>
      )}
    </HeaderHeaderSelectorContainer>
  );
}

function ApiSelectionPanel({
  apiId,
  collection,
  onItemRemoved,
  onItemSelected,
}: {
  apiId: string | undefined;
  collection: CollectionResponseEntry;
  onItemRemoved: (item: ApiResponseEntry) => void;
  onItemSelected: (item: SelectOption<ApiResponseEntry>) => void;
}) {
  const {
    data: apiList,
    error: errorApi,
    isLoading: isLoadingApi,
  } = useGetApisFromCollectionQuery(collection.desc.id);

  const api = apiList?.filter((a) => a.desc.id === apiId)[0];

  return (
    <div>
      <Header>
        <SelectionStatus
          isLoading={isLoadingApi}
          isLoadingText="Loading APIs from the server..."
          itemTypeText="api"
          item={api}
          onItemRemoved={onItemRemoved}
        />
        {!isLoadingApi && <ApiSearchSelector apis={apiList} onItemSelected={onItemSelected} />}
      </Header>
      <HeaderError>
        {errorApi && (
          <ErrorBanner message="Failed to load apis">
            HTTPError: Response code {errorApi.code} ({errorApi.message})
          </ErrorBanner>
        )}
      </HeaderError>
    </div>
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
